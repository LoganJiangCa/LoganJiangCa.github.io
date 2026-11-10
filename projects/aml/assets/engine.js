/* Browser-only rule engine. Money uses BigInt cents; no network or persistence. */
(function (root) {
  "use strict";
  const HIT = "命中", MISS = "未命中", UNKNOWN = "无法评价";
  const HIGH = "高危（优先核查）", ATTENTION = "关注（补充核查）", INSUFFICIENT = "资料不足", CLEAR = "暂未发现明显异常";
  class DataError extends Error {}
  class Unavailable extends Error {
    constructor(reason, actual = {}) { super(reason); this.actual = actual; }
  }
  const key = (...values) => JSON.stringify(values);
  const unique = values => [...new Set(values)];
  const sum = values => values.reduce((a, b) => a + b, 0n);
  const json = value => JSON.stringify(value, (_, v) => typeof v === "bigint" ? v.toString() : v);
  const safeInteger = n => n <= BigInt(Number.MAX_SAFE_INTEGER) && n >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(n) : n.toString();

  function decimal(value) {
    const text = String(value).trim();
    const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
    if (!match) throw new DataError(`数值格式无效：${text}`);
    const fraction = match[3] || match[4] || "", exponent = Number(match[5] || 0);
    if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 10000) throw new DataError("数值指数超出浏览器可处理范围");
    let n = BigInt((match[2] || "0") + fraction) * (match[1] === "-" ? -1n : 1n);
    const scale = fraction.length - exponent;
    return scale >= 0 ? { n, d: 10n ** BigInt(scale) } : { n: n * 10n ** BigInt(-scale), d: 1n };
  }
  function moneyCents(value, allowNegative = false) {
    if (value === "" || value === null || value === undefined) return null;
    const {n, d} = decimal(value);
    if ((!allowNegative && n < 0n) || (n * 100n) % d !== 0n) throw new DataError(`金额必须非负且最多两位小数：${value}`);
    return n * 100n / d;
  }
  function roundFraction(n, d) {
    const negative = n < 0n, value = negative ? -n : n;
    const rounded = value / d + ((value % d) * 2n >= d ? 1n : 0n);
    return negative ? -rounded : rounded;
  }
  function divideText(n, d, places = 12) {
    n = BigInt(n); d = BigInt(d);
    const negative = n < 0n; if (negative) n = -n;
    let text = (n / d).toString(), remainder = n % d, digits = "";
    for (let i = 0; i < places && remainder; i++) { remainder *= 10n; digits += (remainder / d).toString(); remainder %= d; }
    return (negative ? "-" : "") + text + (digits ? "." + digits : "");
  }
  function ratio(numerator, denominator, threshold, comparison = "ge") {
    if (BigInt(denominator) === 0n) throw new Unavailable("分母为0，比例无法评价");
    const t = decimal(threshold), left = BigInt(numerator) * t.d, right = BigInt(denominator) * t.n;
    return comparison === "le" ? left <= right : left >= right;
  }
  function timestamp(value, field = "日期", withTime = false, optional = true) {
    if (value === "" && optional) return "";
    const pattern = withTime ? /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(value)) throw new DataError(`${field}格式错误：${value}`);
    const parsed = new Date(withTime ? value.replace(" ", "T") + "Z" : value + "T00:00:00Z");
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, withTime ? 19 : 10).replace("T", " ") !== value) throw new DataError(`${field}日期无效：${value}`);
    return value;
  }
  const epoch = value => new Date(value.length === 10 ? value + "T00:00:00Z" : value.replace(" ", "T") + "Z").getTime();
  const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = []; let row = [], field = "", quoted = false, afterQuote = false;
    const finishRow = () => { row.push(field); if (row.length > 1 || row[0].trim() !== "") rows.push(row); row = []; field = ""; afterQuote = false; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { quoted = false; afterQuote = true; }
        else field += c;
      } else if (c === '"') {
        if (field || afterQuote) throw new DataError("CSV引号格式无效");
        quoted = true;
      } else if (c === ",") { row.push(field); field = ""; afterQuote = false; }
      else if (c === "\r" || c === "\n") { if (c === "\r" && text[i + 1] === "\n") i++; finishRow(); }
      else { if (afterQuote) throw new DataError("CSV闭合引号后存在多余字符"); field += c; }
    }
    if (quoted) throw new DataError("CSV引号未闭合");
    if (field || row.length) finishRow();
    if (!rows.length) throw new DataError("CSV缺少表头");
    const headers = rows.shift();
    if (unique(headers).length !== headers.length) throw new DataError("CSV表头重复");
    return {headers, records: rows.map((r, i) => {
      if (r.length !== headers.length) throw new DataError(`CSV第${i + 2}行字段数量不符`);
      return Object.fromEntries(headers.map((h, j) => [h, r[j].trim()]));
    })};
  }

  function prepareDataset(sources, contract) {
    if (!sources.transactions) throw new DataError("请提供交易流水CSV");
    const data = { deduplicated: {}, rates: new Map() };
    for (const [table, expected] of Object.entries(contract.schemas)) {
      const parsed = sources[table] ? parseCSV(sources[table]) : {headers: expected, records: []};
      const required = table === "transactions" ? expected.slice(0, 7) : expected;
      const missing = required.filter(c => !parsed.headers.includes(c)), extra = parsed.headers.filter(c => !expected.includes(c));
      if (missing.length || extra.length) throw new DataError(`${table}字段不符；缺少${missing.join("、") || "无"}；多余${extra.join("、") || "无"}`);
      const seen = new Map(), records = [];
      for (const raw of parsed.records) {
        const r = Object.fromEntries(expected.map(c => [c, raw[c] || ""]));
        for (const c of contract.keys[table]) if (r[c] === "") throw new DataError(`${table}.${c}为必填标识`);
        const identity = key(...contract.keys[table].map(c => r[c])), content = json(r);
        if (seen.has(identity)) { if (seen.get(identity) !== content) throw new DataError(`${table}同一标识存在冲突记录，不自动覆盖`); continue; }
        seen.set(identity, content);
        if ("currency" in r && r.currency && !/^[A-Z]{3}$/.test(r.currency)) throw new DataError("currency必须为三个大写字母");
        if (table === "transactions" || table === "events") {
          timestamp(r.timestamp, "timestamp", true, false); r.day = r.timestamp.slice(0, 10); r.ms = epoch(r.timestamp);
        }
        if (table === "transactions") {
          if (!["I", "O", ""].includes(r.direction)) throw new DataError("direction只允许I（收入）、O（支出）或空值");
          r.cents = moneyCents(r.amount);
        }
        if (table === "balances") r.cents = moneyCents(r.balance, true);
        if ("date" in r) timestamp(r.date, "date", false, false);
        if (table === "fx_rates") {
          r.rate = decimal(r.cny_per_unit);
          if (r.rate.n <= 0n || (r.currency === "CNY" && r.rate.n !== r.rate.d)) throw new DataError("汇率必须为明确正数，CNY只能为1");
          data.rates.set(key(r.date, r.currency), r.rate);
        }
        if (table === "accounts") {
          for (const c of ["opening_date", "birth_date", "coverage_start", "coverage_end"]) timestamp(r[c], c);
          for (const [c, allowed] of Object.entries({customer_type: ["", "individual", "company"], account_type: ["", "debit_card", "credit_card", "corporate_account", "other"], business_status: ["", "normal", "abnormal"], history_complete: ["", "0", "1"]})) {
            if (!allowed.includes(r[c])) throw new DataError(`${c}取值不符合固定格式`);
          }
          if (r.card_count && !/^\d+$/.test(r.card_count)) throw new DataError("card_count必须为非负整数或空值");
        }
        records.push(r);
      }
      data[table] = records; data.deduplicated[table] = parsed.records.length - records.length;
    }
    data.transactions.sort((a,b) => cmp(a.timestamp,b.timestamp) || cmp(a.bank,b.bank) || cmp(a.account_id,b.account_id) || cmp(a.transaction_id,b.transaction_id));
    data.rate = (day, currency) => currency === "CNY" ? {n: 1n, d: 1n} : data.rates.get(key(day, currency));
    data.cny = (cents, currency, day) => { const rate = data.rate(day, currency); return cents === null || !currency || !rate ? null : roundFraction(cents * rate.n, rate.d); };
    return data;
  }
  function combine(statuses, operator) {
    if (!statuses.length || operator === "UNKNOWN") return UNKNOWN;
    if (operator === "SINGLE") { if (statuses.length !== 1) throw new DataError("SINGLE只能包含一条子规则"); return statuses[0]; }
    if (operator === "AND") return statuses.includes(MISS) ? MISS : statuses.includes(UNKNOWN) ? UNKNOWN : HIT;
    if (operator === "OR") return statuses.includes(HIT) ? HIT : statuses.includes(UNKNOWN) ? UNKNOWN : MISS;
    throw new DataError("未知组关系：" + operator);
  }
  const verdict = (hit, actual, ids = [], refs = []) => ({status: hit ? HIT : MISS, actual, reason: "", transaction_ids: [...ids], auxiliary_refs: [...refs]});
  function groupBy(rows, field) {
    const groups = new Map(); for (const row of rows) { const value = row[field]; if (!groups.has(value)) groups.set(value, []); groups.get(value).push(row); } return groups;
  }

  class AccountContext {
    constructor(data, bank, accountId, start, end, reference) {
      Object.assign(this, {data, bank, accountId, start, end, reference});
      this.history = data.transactions.filter(r => r.bank === bank && r.account_id === accountId).sort((a,b) => cmp(a.timestamp,b.timestamp) || cmp(a.direction,b.direction) || cmp(a.transaction_id,b.transaction_id));
      this.tx = this.history.filter(r => r.day >= start && r.day <= end);
      this.profile = data.accounts.find(r => r.bank === bank && r.account_id === accountId) || {};
      this.cache = new Map();
    }
    get ids() { return this.tx.map(r => r.transaction_id); }
    require(columns, frame = this.tx) {
      if (!frame.length) throw new Unavailable("分析期间没有可评价交易");
      for (const c of columns) if (frame.some(r => r[c] === "" || r[c] === null || r[c] === undefined)) throw new Unavailable(`流水缺少${c}，不以缺失值代替0或未命中`);
    }
    amounts(frame = this.tx) {
      this.require(["cents", "currency"], frame);
      const values = frame.map(r => this.data.cny(r.cents, r.currency, r.day));
      if (values.includes(null)) throw new Unavailable("缺少明确的当日人民币换算汇率：" + unique(frame.filter(r => !this.data.rate(r.day,r.currency)).map(r => r.day + ":" + r.currency)).slice(0,6).join(", "));
      return values;
    }
    profileValue(field) { const value = this.profile[field]; if (value === "" || value === null || value === undefined) throw new Unavailable("缺少账户资料字段" + field); return value; }
    accountRef(field) { return `accounts:${this.bank}/${this.accountId}:${field}`; }
    rapidPairs(p) {
      const cacheKey = json([p.minimum_cny_cents,p.seconds,p.difference_ratio]);
      if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
      this.require(["direction", "currency", "cents"]); const amounts = this.amounts(); let waiting = []; const pairs = [];
      this.tx.forEach((row, i) => {
        waiting = waiting.filter(r => (row.ms - r.ms) <= p.seconds * 1000);
        if (amounts[i] < BigInt(p.minimum_cny_cents)) return;
        if (row.direction === "I") waiting.push(row);
        else {
          const match = waiting.findIndex(r => r.currency === row.currency && ratio(r.cents >= row.cents ? r.cents-row.cents : row.cents-r.cents, r.cents, p.difference_ratio, "le"));
          if (match >= 0) { pairs.push([waiting[match].transaction_id,row.transaction_id]); waiting.splice(match,1); }
        }
      }); this.cache.set(cacheKey,pairs); return pairs;
    }
    evaluate(spec) {
      try {
        if (spec.kind === "pending") {
          const actual = {}, refs = [];
          if (spec.params?.event_type) {
            const events = this.data.events.filter(r => r.bank === this.bank && r.account_id === this.accountId && r.day >= this.start && r.day <= this.end && r.event_type === spec.params.event_type);
            actual["已提供对应事件条数"] = events.length; refs.push(...events.map(r => `events:${this.bank}/${this.accountId}:${r.event_id}`));
          }
          return {status: UNKNOWN, actual, reason: spec.reason, transaction_ids: [], auxiliary_refs: refs};
        }
        if (!evaluators[spec.kind]) throw new DataError("浏览器尚不支持规则计算：" + spec.kind);
        return evaluators[spec.kind].call(this, spec.params || {});
      } catch (e) { if (!(e instanceof Unavailable)) throw e; return {status:UNKNOWN,actual:e.actual,reason:e.message,transaction_ids:[],auxiliary_refs:[]}; }
    }
  }
  const evaluators = {
    rapid_count(p) { const pairs = this.rapidPairs(p); return verdict(pairs.length > p.count_gt, {"配对数":pairs.length,"配对":pairs},pairs.flat()); },
    rapid_exists(p) { return evaluators.rapid_count.call(this,{...p,count_gt:0}); },
    closing_ratio(p) {
      this.require(["currency"]); const days = unique(this.tx.map(r => r.day)).sort(), currencies = unique(this.tx.map(r => r.currency));
      const balances = this.data.balances.filter(r => r.bank === this.bank && r.account_id === this.accountId), totals = {}, missing = [], refs = [];
      for (const day of days) {
        const rows = balances.filter(r => r.date === day), amounts = rows.map(r => this.data.cny(r.cents,r.currency,day));
        if (!currencies.every(c => rows.some(r => r.currency === c)) || !amounts.length || amounts.includes(null)) { missing.push(day); continue; }
        totals[day] = sum(amounts); refs.push(...rows.map(r => `balances:${this.bank}/${this.accountId}:${day}:${r.currency}`));
      }
      if (missing.length) throw new Unavailable("缺少完整日终余额或其当日汇率；交易后余额不能代替日终余额",{"缺失日期":missing,"已知日终余额_分":totals});
      const count = Object.values(totals).filter(v => v <= BigInt(p.balance_cny_cents)).length;
      return verdict(ratio(count,days.length,p.ratio_ge),{"达标天数":count,"交易天数":days.length,"日终余额_分":totals},this.ids,refs);
    },
    amount_interval(p) {
      if (p.direction) this.require(["direction"]);
      const frame = p.direction ? this.tx.filter(r => r.direction === p.direction) : this.tx, amounts = this.amounts(frame);
      const hits = frame.filter((_,i) => amounts[i] >= BigInt(p.lower_cny_cents) && amounts[i] <= BigInt(p.upper_cny_cents));
      if (!hits.length) return verdict(false,{"异常笔数":0,"说明":"没有落入原始金额区间的交易"},frame.map(r => r.transaction_id));
      const first = hits[0].timestamp, last = hits[hits.length-1].timestamp, window = frame.filter(r => r.timestamp >= first && r.timestamp <= last);
      return verdict(ratio(hits.length,window.length,p.ratio_ge),{"异常笔数":hits.length,"区间总笔数":window.length,"首笔":first,"末笔":last},window.map(r=>r.transaction_id));
    },
    counterparty_ratio(p) {
      this.require(["direction","counterparty_bank","counterparty_account_id"]);
      const counts = Object.fromEntries(["I","O"].map(d => [d,unique(this.tx.filter(r=>r.direction===d).map(r=>key(r.counterparty_bank,r.counterparty_account_id))).length]));
      return verdict(ratio(counts[p.numerator_direction],counts[p.denominator_direction],p.threshold,p.comparison),{"入向对手数":counts.I,"出向对手数":counts.O,"分子":counts[p.numerator_direction],"分母":counts[p.denominator_direction]},this.ids);
    },
    opening_recent(p) {
      const opened = this.profileValue("opening_date"); if (opened > this.reference) throw new Unavailable("开户日晚于分析基准日");
      const [year,month,day] = opened.split("-").map(Number), anniversaryYear = year+p.years_le;
      const maxDay = new Date(`${String(anniversaryYear).padStart(4,"0")}-${String(month).padStart(2,"0")}-01T00:00:00Z`); maxDay.setUTCMonth(month); maxDay.setUTCDate(0);
      const anniversary = `${String(anniversaryYear).padStart(4,"0")}-${String(month).padStart(2,"0")}-${String(Math.min(day,maxDay.getUTCDate())).padStart(2,"0")}`;
      return verdict(this.reference <= anniversary,{"开户日":opened,"基准日":this.reference,"周年日":anniversary},[],[this.accountRef("opening_date")]);
    },
    customer_type(p) { const v = this.profileValue("customer_type"); return verdict(v===p.equals,{"资料客户类型":v},[],[this.accountRef("customer_type")]); },
    age(p) {
      const birthday = this.profileValue("birth_date"); if (birthday > this.reference) throw new Unavailable("出生日晚于分析基准日");
      const years = Number(this.reference.slice(0,4))-Number(birthday.slice(0,4))-(this.reference.slice(5)<birthday.slice(5)?1:0);
      return verdict(years<=p.years_le,{"基准日周岁":years,"基准日":this.reference},[],[this.accountRef("birth_date")]);
    },
    first_abnormal(p) {
      const opened = this.profileValue("opening_date"), left = this.profileValue("coverage_start"), right = this.profileValue("coverage_end");
      if (this.profileValue("history_complete")!=="1" || left>opened || right<this.end) throw new Unavailable("首次异常需声明并提供从开户至分析期末的完整历史");
      const frame = this.history.filter(r=>r.day>=opened&&r.day<=this.end); this.require(["counterparty_name","remark"],frame); const amounts=this.amounts(frame);
      const candidates = frame.filter((r,i)=>amounts[i]>BigInt(p.amount_gt_cny_cents)&&p.keywords.some(k=>r.counterparty_name.includes(k)||r.remark.includes(k)));
      if (!candidates.length) return verdict(false,{"符合条件历史交易":0},frame.map(r=>r.transaction_id),[this.accountRef("history_complete")]);
      const first=candidates[0], days=(epoch(first.day)-epoch(opened))/86400000;
      return verdict(days>=0&&days<=p.days_le,{"首次异常":first.timestamp,"距开户天数":days},[first.transaction_id],[this.accountRef("opening_date"),this.accountRef("history_complete")]);
    },
    silent_test(p) {
      this.require(["direction","remark"]); const amounts=new Map();
      this.amounts().forEach((v,i)=>amounts.set(this.tx[i].transaction_id,v));
      let previous=null,uncertain=false; const ids=[];
      for(const r of this.history){if(r.day>this.end)break;if(r.day>=this.start){if(!previous)uncertain=true;else if(r.ms-previous.ms>=p.gap_seconds_ge*1000&&r.direction==="I"&&amounts.get(r.transaction_id)<=BigInt(p.amount_cny_cents_le)&&!r.remark.includes(p.exclude_keyword))ids.push(previous.transaction_id,r.transaction_id);}previous=r;}
      if(!ids.length&&uncertain)throw new Unavailable("首条期间流水缺少前序流水，无法确认其是否为沉默期后首笔",{"已观察到命中":0});
      return verdict(ids.length>0,{"沉默后测试交易数":ids.length/2},unique(ids));
    },
    run_day_ratio(p) {
      this.require(["direction"]);const maxima={};let count=0;
      for(const[day,rows]of groupBy(this.tx,"day")){let current=0,max=0;for(const r of rows){current=r.direction===p.direction?current+1:0;max=Math.max(max,current);}maxima[day]=max;if(max>=p.run_ge)count++;}
      return verdict(ratio(count,Object.keys(maxima).length,p.ratio_threshold,p.comparison),{"达标天数":count,"交易天数":Object.keys(maxima).length,"每日最长连续笔数":maxima},this.ids);
    },
    keyword_sum(p) {
      this.require([p.field]);const matched=this.tx.filter(r=>p.keywords.some(k=>r[p.field].includes(k)));
      if(!matched.length)return verdict(false,{"关键词匹配笔数":0,"匹配金额_人民币分":0n},this.ids);
      const total=sum(this.amounts(matched));return verdict(total>=BigInt(p.amount_ge_cny_cents),{"关键词匹配笔数":matched.length,"匹配金额_人民币分":total},matched.map(r=>r.transaction_id));
    },
    business_status(p) {const v=this.profileValue("business_status");return verdict(v===p.equals,{"经营状态":v},[],[this.accountRef("business_status")]);},
    daytime_ratio(p) {this.require([]);const n=this.tx.filter(r=>r.timestamp.slice(11)>=p.start_time&&r.timestamp.slice(11)<=p.end_time).length;return verdict(ratio(n,this.tx.length,p.ratio_ge),{"日间笔数":n,"总笔数":this.tx.length},this.ids);},
    active_days(p) {this.require([]);const n=unique(this.tx.map(r=>r.day)).length;return verdict(n<=p.days_le,{"不同交易日数":n},this.ids);},
    card_count(p) {const n=BigInt(this.profileValue("card_count"));return verdict(n>=BigInt(p.count_ge),{"资料名下卡数":safeInteger(n)},[],[this.accountRef("card_count")]);},
    account_type(p) {const v=this.profileValue("account_type");return verdict(v===p.equals,{"资料账户类型":v},[],[this.accountRef("account_type")]);},
    nonsilent_daily_amount(p) {
      const amounts=this.amounts(),days=new Map();this.tx.forEach((r,i)=>{const v=days.get(r.day)||{total:0n,count:0};v.total+=amounts[i];v.count++;days.set(r.day,v);});
      const eligible=[...days.values()].filter(v=>v.count>=p.min_count),total=sum(eligible.map(v=>v.total));
      if(!eligible.length)throw new Unavailable("没有满足笔数条件的非沉默日，平均值分母为0");
      return verdict(total>BigInt(p.average_gt_cny_cents)*BigInt(eligible.length),{"非沉默日数":eligible.length,"总额_分":total,"日均金额_分":divideText(total,BigInt(eligible.length))},this.ids);
    },
    nonsilent_daily_count(p) {
      const amounts=this.amounts(),days=new Map();this.tx.forEach((r,i)=>{const v=days.get(r.day)||{total:0n,count:0};v.total+=amounts[i];v.count++;days.set(r.day,v);});
      const eligible=[...days.values()].filter(v=>v.total>=BigInt(p.min_daily_cny_cents)),n=eligible.reduce((a,v)=>a+v.count,0);
      if(!eligible.length)throw new Unavailable("没有满足金额条件的非沉默日，平均值分母为0");
      return verdict(n>p.average_gt*eligible.length,{"非沉默日数":eligible.length,"总笔数":n,"日均笔数":divideText(BigInt(n),BigInt(eligible.length))},this.ids);
    }
  };

  function prettyMoney(cents) {
    const x=decimal(cents), scale=x.d*100n, abs=x.n<0n?-x.n:x.n;
    const unit=abs>=scale*100000000n?100000000n:abs>=scale*10000n?10000n:1n;
    const hundredths=roundFraction(x.n*100n,scale*unit),negative=hundredths<0n,positive=negative?-hundredths:hundredths;
    let text=(positive/100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
    const tail=(positive%100n).toString().padStart(2,"0").replace(/0+$/,"");if(tail)text+="."+tail;
    return (negative?"-":"")+text+(unit===100000000n?"亿元":unit===10000n?"万元":"元");
  }
  function explainSignal(category,rows,fallback){
    const metrics=rows.map(r=>JSON.parse(r.actual));
    if(category==="rapid_flow")return `有${Math.max(...metrics.map(m=>m["配对数"]||0))}对短时间内收到钱又转走、金额相近的交易，资金周转很快`;
    if(category==="keyword_amount"){const total=metrics.map(m=>BigInt(m["匹配金额_人民币分"]||0)).reduce((a,b)=>a>b?a:b,0n);return `名称或备注含黄金、珠宝等敏感词的交易累计达到${prettyMoney(total.toString())}（按收支正金额合计）`;}
    if(category==="amount_cluster"){const m=metrics.filter(m=>m["区间总笔数"]).sort((a,b)=>b["异常笔数"]-a["异常笔数"])[0];if(m)return `首笔至末笔异常交易之间，${m["区间总笔数"]}笔中有${m["异常笔数"]}笔落在原表异常金额区间`;}
    if(category==="counterparty_concentration"){const m=metrics.filter(m=>"入向对手数"in m).sort((a,b)=>Math.abs(b["入向对手数"]-b["出向对手数"])-Math.abs(a["入向对手数"]-a["出向对手数"]))[0];if(m)return `收款来源有${m["入向对手数"]}个账户，付款去向有${m["出向对手数"]}个账户，进出两端对手数量明显不对称`;}
    if(category==="test_transfer")return `长时间没有交易后，出现了${Math.max(...metrics.map(m=>m["沉默后测试交易数"]||0))}次符合原表小额试转条件的入账，需要核对用途`;
    if(category==="run_pattern")return "部分交易日连续多笔付款较常见，而连续多笔收款的交易日占比较低";
    if(category==="daily_intensity"){const a=metrics.find(m=>"日均金额_分"in m),c=metrics.find(m=>"日均笔数"in m);if(a&&c)return `按原表各自的活跃日口径计算，日均交易金额为${prettyMoney(a["日均金额_分"])}、日均交易${Number(c["日均笔数"]).toLocaleString("en-US",{maximumFractionDigits:2})}笔，金额和笔数同时偏大`;}
    if(category==="recent_keyword"){const days=metrics.filter(m=>"距开户天数"in m).map(m=>m["距开户天数"]);if(days.length)return `开户后${Math.min(...days)}天就出现了首笔含敏感关键词的大额交易`;}
    return fallback;
  }
  function buildConclusions(accounts,details,config){
    const policy=config.screening,output=[];
    for(const[identity,modelRows]of groupBy(accounts.map(r=>({...r,identity:key(r.bank,r.account_id)})),"identity")){
      const[bank,account_id]=JSON.parse(identity),rows=details.filter(r=>r.bank===bank&&r.account_id===account_id);
      const groups=[...new Map(rows.map(r=>[r.group_id,r])).values()],confirmed=rows.filter(r=>r.group_status===HIT&&r.status===HIT),signals=[];
      for(const[category,spec]of Object.entries(policy.signals)){const matches=confirmed.filter(r=>spec.groups.includes(r.group_id));if(matches.length)signals.push({category,name:spec.name,priority:spec.priority,explanation:explainSignal(category,matches,spec.name),groups:unique(matches.map(r=>r.group_id)).sort(),models:unique(matches.map(r=>r.model_id)).sort(),rules:unique(matches.map(r=>r.rule_id)).sort()});}
      const unknown=groups.filter(r=>r.group_status===UNKNOWN).length,count=signals.length;let level,conclusion,action;
      if(count>=policy.high_risk_min_categories&&signals.some(s=>s.priority)){level=HIGH;conclusion=`这个账户有${count}类已确认的异常资金行为，已达到本项目的高危筛查条件，应优先人工核查。`;action="优先核对资金来源、最终去向和交易用途，并检查是否有对应的业务凭证。";}
      else if(count){level=ATTENTION;conclusion=`这个账户出现了${count}类已确认的异常行为，当前还没有达到本项目的高危筛查条件，建议补充核查。`;action="围绕已出现的异常核对交易用途，补齐无法评价规则所需资料后再判断。";}
      else if(unknown){level=INSUFFICIENT;conclusion="目前已评价结果不足以支持高危判断，仍有规则无法判断，不能据此把账户视为低风险。";action="先补齐缺少的账户资料、日终余额或其他规则依据，并确认未明确的业务口径。";}
      else{level=CLEAR;conclusion="在当前选定模型和分析期间内，未发现达到本项目筛查条件的异常行为；这不等于账户绝对没有风险。";action="保留本次结果和证据，结合后续交易变化继续观察。";}
      if(unknown)conclusion+=` 另有${unknown}个规则组无法评价，这部分没有当作未命中。`;
      output.push({bank,account_id,risk_level:level,is_high_risk:level===HIGH,confirmed_behavior_types:count,risk_reasons:signals.map(s=>s.explanation).join("；"),plain_conclusion:conclusion,suggested_action:action,screening_unknown_groups:unknown,screening_evaluated_groups:groups.length-unknown,screening_models:unique(modelRows.map(r=>r.model_id)).sort().join("、"),matched_models:unique(signals.flatMap(s=>s.models)).sort().join("、"),source_group_ids:json(unique(signals.flatMap(s=>s.groups)).sort()),signal_details:json(signals),screening_policy:policy.version});
    }
    const rank={[HIGH]:0,[ATTENTION]:1,[INSUFFICIENT]:2,[CLEAR]:3};return output.sort((a,b)=>rank[a.risk_level]-rank[b.risk_level]||b.confirmed_behavior_types-a.confirmed_behavior_types||cmp(a.bank,b.bank)||cmp(a.account_id,b.account_id));
  }
  function analyze(data,start,end,reference,modelIds,config){
    timestamp(start,"分析起日",false,false);timestamp(end,"分析止日",false,false);timestamp(reference,"分析基准日",false,false);
    if(start>end||reference<end)throw new DataError("分析起日须不晚于止日，分析基准日须不早于分析止日");
    const requested=modelIds===undefined?config.models.map(m=>m.id):modelIds,models=config.models.filter(m=>requested.includes(m.id));
    if(!models.length||requested.some(id=>!models.some(m=>m.id===id)))throw new DataError("请选择有效模型");
    const identities=unique([...data.transactions,...data.accounts].map(r=>key(r.bank,r.account_id))).map(x=>JSON.parse(x)).sort((a,b)=>cmp(a[0],b[0])||cmp(a[1],b[1]));
    const accounts=[],details=[];
    for(const[bank,account_id]of identities){const ctx=new AccountContext(data,bank,account_id,start,end,reference);
      for(const model of models){let score=0,unresolved=0,hitGroups=0,unknownGroups=0,evaluated=0,unknown=0;const reasons=[];
        for(const group of model.groups){const children=group.rules.map(r=>ctx.evaluate(r.evaluator)),groupStatus=combine(children.map(c=>c.status),group.operator),points=groupStatus===HIT?group.points:0;
          score+=points;if(groupStatus===HIT){hitGroups++;reasons.push(`${group.id} ${group.name} (+${points})`);}if(groupStatus===UNKNOWN){unknownGroups++;unresolved+=group.points;}
          group.rules.forEach((rule,index)=>{const child=children[index];if(child.status===UNKNOWN)unknown++;else evaluated++;
            details.push({bank,account_id,model_id:model.id,model_name:model.name,group_id:group.id,group_name:group.name,operator:group.operator,group_status:groupStatus,group_points:group.points,awarded_points:index===0?points:0,group_note:group.operator_note,points_cell:group.points_cell,rule_id:rule.id,rule_name:rule.name,status:child.status,actual:json(child.actual),threshold:rule.threshold_raw,threshold_cell:rule.threshold_cell,relation_raw:rule.relation_raw,relation_cell:rule.relation_cell,suggestion:rule.suggestion_raw,reason:child.reason,transaction_ids:json(child.transaction_ids),auxiliary_refs:json(child.auxiliary_refs),analysis_start:start,analysis_end:end,reference_date:reference});
          });
        }
        accounts.push({bank,account_id,model_id:model.id,model_name:model.name,score,model_total:model.groups.reduce((s,g)=>s+g.points,0),unresolved_points:unresolved,score_upper_bound:score+unresolved,hit_groups:hitGroups,unknown_groups:unknownGroups,evaluated_rules:evaluated,unknown_rules:unknown,hit_reasons:reasons.join("；"),analysis_start:start,analysis_end:end,reference_date:reference});
      }
    }
    if(!accounts.length)throw new DataError("没有账户可分析");
    accounts.sort((a,b)=>cmp(a.model_id,b.model_id)||b.score-a.score||cmp(a.bank,b.bank)||cmp(a.account_id,b.account_id));
    const conclusions=buildConclusions(accounts,details,config),lookup=new Map(conclusions.map(r=>[key(r.bank,r.account_id),r]));
    for(const account of accounts){const c=lookup.get(key(account.bank,account.account_id));for(const field of["risk_level","is_high_risk","confirmed_behavior_types","risk_reasons","plain_conclusion","suggested_action","screening_models","screening_policy"])account[field]=c[field];}
    return {accounts,details,conclusions};
  }
  function csvText(rows,columns){
    const fields=columns||Object.keys(rows[0]||{});const quote=v=>{let t=v===null||v===undefined?"":typeof v==="object"?json(v):String(v);if(/^[\s]*[=+@-]/.test(t)&&typeof v==="string")t="'"+t;return '"'+t.replace(/"/g,'""')+'"';};
    return "\uFEFF"+[fields.map(quote).join(","),...rows.map(r=>fields.map(f=>quote(r[f])).join(","))].join("\n")+"\n";
  }
  root.AML=Object.freeze({HIT,MISS,UNKNOWN,HIGH,ATTENTION,INSUFFICIENT,CLEAR,DataError,Unavailable,decimal,moneyCents,roundFraction,ratio,parseCSV,prepareDataset,combine,AccountContext,analyze,buildConclusions,csvText,json,prettyMoney,key});
})(globalThis);
