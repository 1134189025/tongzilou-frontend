/**
 * ============================================================
 *  筒子楼 2008 · QQ 侧边栏行动面板  (frontend/index.js)
 *  - 纯 vanilla JS，零依赖，单文件，可直接静态托管。
 *  - 作用：给「重生2008年北京筒子楼」角色卡提供可点按的行动指引
 *    · 好友攻略卡（半透：只看阶段名+可做示例，不显示数值门槛）
 *    · 目标板（短/中/长线）
 *    · 行动大厅（按地点 x 时段分组）
 *    · 每轮「此刻推荐」（监听新消息自动刷新）
 *    · 按需召唤（玩家说「面板/帮助」→ AI 回复带占位符 → 重新挂载）
 *  - 发送格式：【行动】+一句话，AI 按正常剧情承接，不破坏合理性审查。
 * ============================================================
 */
(function () {
  'use strict';
  if (window.__tzl_panel__) {
    try { window.__tzl_panel__.show(); window.__tzl_panel__.refresh(); } catch (e) {}
    return;
  }

  var VERSION = '1.0.0';
  var BASE = 'https://raw.githubusercontent.com/zhamuqiu/tongren2/refs/heads/main';

  /* ──────────────────────────── 基础数据 ──────────────────────────── */
  var CHARS = [
    { name: '洪晓彤', pin: 'hong_xiaotong', group: '家人', rel: '妈 · 班主任（36）', desc: '嘴贫爱玩的大孩子，一个人扛着仨孩子' },
    { name: '洪晓蕾', pin: 'hong_xiaolei', group: '家人', rel: '大姐（16）', desc: '嘴硬心软，替你扛了半个家' },
    { name: '洪晓花', pin: 'hong_xiaohua', group: '家人', rel: '小妹（10）', desc: '圆脸马尾疯丫头，人没齐不动筷子' },
    { name: '苏雨夜', pin: 'su_yuye', group: '街坊', rel: '苏姨（32）', desc: '苏悦她妈，全楼最实诚的人' },
    { name: '苏悦', pin: 'su_yue', group: '街坊', rel: '青梅（12）', desc: '怕狗但会挡在你前面的假小子' },
    { name: '林秀', pin: 'lin_xiu', group: '街坊', rel: '秀秀姐（16）', desc: '大姐的跟屁虫，闷慢偷摸' },
    { name: '李莉', pin: 'li_li', group: '同学', rel: '同桌（12）', desc: '金发蓝眼的假洋鬼子，英语37分' },
    { name: '唐果', pin: 'tang_guo', group: '闲人', rel: '四楼闲人（22）', desc: '卖唱教琴混日子，说话跟胡同串子似的' },
    { name: '大狗', pin: 'dagou', group: '特别', rel: '六六 · 全楼报警器', desc: '苏悦唯一不怕的狗，该叫的时候叫' }
  ];

  var GROUPS = ['家人', '街坊', '同学', '闲人', '特别'];

  var STAGES = {
    1: { name: '第一阶·陌生', can: ['客气打招呼、正常聊天', '递东西、帮忙跑腿', '保持礼貌距离，别急着凑近乎'] },
    2: { name: '第二阶·熟络', can: ['可以开玩笑、互相损两句', '拍肩、拽袖子、凑近说话', '一起做事：择菜、跑腿、写作业'] },
    3: { name: '第三阶·依赖', can: ['靠肩、牵手、长时间对视', '听她说心事，她开始依赖你', '可以主动约她（小声）'] },
    4: { name: '第四阶·越界', can: ['她会主动拉近、试探、把距离压到极近', '可以回应她的靠近', '注意：关系再近也要尊重意愿，她随时可以喊停'] }
  };

  /* 每角色每阶 2 个推荐行动（均为 SFW） */
  var CHAR_ACTS = {
    '洪晓彤': {
      1: [['帮妈端早餐', '我帮妈把粥和馒头端进屋，摆好筷子'], ['听妈念叨学校', '我坐桌边听妈念叨周六开会的事，给她搭话']],
      2: [['陪妈择菜唠嗑', '我搬小凳坐妈旁边择菜，听她唠楼道里的事'], ['陪妈看MV', '我陪妈看周杰伦《青花瓷》MV，陪她点评']],
      3: [['陪妈看路灯', '晚上我陪妈在走廊尽头坐会儿，看楼下路灯'], ['说声辛苦了', '我认真跟妈说：这些年您辛苦了']],
      4: [['给妈揉肩', '我绕到妈身后给她揉揉肩膀'], ['陪妈喝一罐', '我拎两罐啤酒，陪妈在楼道里喝一罐、说说话']]
    },
    '洪晓蕾': {
      1: [['给姐递水', '我给姐倒了杯温水放她手边'], ['认真听讲题', '我坐直了认真听姐讲题，不犯困']],
      2: [['帮姐择菜', '我搬小凳帮姐择菜，听她损我'], ['陪姐买冰棍', '我陪姐去小卖部买冰棍，她请客我跑腿']],
      3: [['分担家务', '我主动把碗刷了，让姐歇会'], ['说句软话', '我小声跟姐说：这些年辛苦你了']],
      4: [['给姐捶背', '我让姐坐下，给她捶捶背'], ['深夜说说话', '夜深了我陪姐在窗边坐着，聊点心里话']]
    },
    '洪晓花': {
      1: [['陪妹跳皮筋', '我陪晓花在楼下跳皮筋'], ['帮妹看作业', '我帮晓花看看数学卷子']],
      2: [['给妹买冰棍', '我给晓花买根小豆冰棍'], ['陪妹去公园', '我领晓花去公园玩一下午']],
      3: [['给妹扎辫子', '我学着给晓花扎辫子'], ['睡前讲故事', '睡前我给晓花讲个故事']],
      4: [['陪妹看星星', '我陪晓花趴窗台数星星'], ['背妹回家', '晓花走累了，我背她回家']]
    },
    '苏雨夜': {
      1: [['帮苏姨搬东西', '我帮苏姨把重物搬上三楼'], ['陪苏姨说话', '我陪苏姨在楼道说几句话']],
      2: [['帮苏姨换灯泡', '我搬凳子帮苏姨换个灯泡'], ['陪苏姨去早市', '我陪苏姨去早市拎菜']],
      3: [['给苏姨送粥', '我端一碗粥给苏姨送去'], ['陪她缝鞋垫', '我坐旁边陪苏姨缝鞋垫唠嗑']],
      4: [['给苏姨揉腰', '苏姨腰酸，我帮她揉揉'], ['听她说说过去', '我认真听苏姨讲年轻时候的事']]
    },
    '苏悦': {
      1: [['陪苏悦疯跑', '我陪苏悦在院里疯跑一下午'], ['一起去小卖部', '我和苏悦去小卖部买北冰洋']],
      2: [['看她爬树', '我站树下给苏悦叫好'], ['帮她补作业', '我帮苏悦把没写完的作业补上']],
      3: [['楼道吃冰棍', '我和苏悦蹲楼道里分一根冰棍'], ['挡在她前面', '走夜路我走外头，挡在她前面']],
      4: [['头碰头看星星', '我和苏悦靠一起看星星'], ['听她把话说完', '我认真听苏悦把没说完的话说完']]
    },
    '林秀': {
      1: [['帮秀秀拿东西', '我帮林秀把东西拎上楼'], ['好好打招呼', '我主动跟林秀打招呼']],
      2: [['陪她买零食', '我陪林秀去小卖部挑零食'], ['帮她择豆角', '我帮林秀一起择豆角']],
      3: [['给她递水擦汗', '我递瓶水给林秀，让她歇会'], ['陪她坐坐', '我安静陪林秀坐一会儿']],
      4: [['送她回家', '我送林秀回家，一路聊几句'], ['说句贴心话', '我轻声跟林秀说：别太累着自己']]
    },
    '李莉': {
      1: [['帮同桌捡书', '我帮李莉捡起掉地上的课本'], ['听她显摆英语', '我认真听李莉显摆她那句 Good morning']],
      2: [['陪练口语', '课间我陪李莉练她那几句英语'], ['分她零食', '我把零食分一半给李莉']],
      3: [['放学一起走', '我陪李莉放学走一段路'], ['看她小本子', '我夸她那个画国旗的小本子好看']],
      4: [['听她说心里话', '我认真听李莉说她的烦心事'], ['送她小贴纸', '我送李莉一张英国国旗贴纸']]
    },
    '唐果': {
      1: [['接她的玉米', '我接过唐果递来的半根玉米'], ['听她贫嘴', '我站楼道听唐果贫两句']],
      2: [['蹲楼道陪她', '我蹲三楼半陪唐果啃玉米'], ['听她弹琴', '我听唐果弹《小星星》']],
      3: [['给她送冰棍', '我给唐果捎根冰棍'], ['陪她坐会', '我陪唐果在楼梯口坐会']],
      4: [['听她说胡话', '我认真听唐果说她的混日子哲学'], ['帮她看琴行', '我去琴行帮唐果看学生']]
    }
  };

  var DOG_ACTS = [
    ['喂六六包子', '我把肉包子掰一半喂给六六'],
    ['摸摸六六', '我蹲下来摸摸六六的脑门'],
    ['夸它两声', '我夸六六：好狗，全楼都靠你罩着']
  ];

  /* 目标板：短/中/长线 */
  var GOALS = [
    { cat: '短线 · 今天就做', items: [
      { t: '陪妈吃顿早饭', m: '我坐到桌前，陪妈一起吃早饭，听她念叨学校的事' },
      { t: '帮姐干件家务', m: '我挽起袖子去公共厨房，帮姐择菜刷碗' },
      { t: '陪妹玩一会', m: '我陪晓花在楼下跳皮筋/看作业' }
    ] },
    { cat: '中线 · 这几天', items: [
      { t: '送出第一份小礼', m: '我用零花钱买了点小东西，找个机会送给想送的人' },
      { t: '制造一次单独相处', m: '我找个自然的理由，和想亲近的人单独待一会' },
      { t: '听一段心事', m: '我主动问问身边人最近有什么心事' }
    ] },
    { cat: '长线 · 这个月', items: [
      { t: '一次出游', m: '我约上想约的人，周末去公园或街上逛逛' },
      { t: '一次交心长谈', m: '夜深人静时，和那个人好好聊一次' },
      { t: '记住每个人的喜好', m: '我留心记下每个人的喜好，准备一个惊喜' }
    ] }
  ];

  /* 行动大厅：按地点分组，带时段条件 */
  var ACTIONS = [];
  function A(g, t, l, label, msg) { ACTIONS.push({ g: g, t: t, l: l, label: label, msg: msg }); }

  A('家', ['morning','day'], ['home'], '帮妈叠衣服', '我帮妈把晾干的校服叠好，码整齐');
  A('家', ['morning','day'], ['home'], '跟姐学做饭', '我让姐教我做道简单的菜');
  A('家', ['day','evening'], ['home'], '听姐讲题', '我坐到书桌前，让姐给我讲几道数学题');
  A('家', ['evening'], ['home'], '陪妹看动画', '我和晓花挤在电视前看动画片');
  A('家', ['night'], ['home'], '陪妈看电视', '我陪妈看会儿电视，听她点评剧情');
  A('家', ['evening'], ['home'], '全家吃晚饭', '一家人围桌吃饭，我帮妈盛饭');
  A('家', ['night'], ['home'], '给妹讲故事', '睡前我给晓花讲个故事');
  A('家', ['night'], ['home'], '和妈说会话', '我坐到妈床边，和她聊几句家常');

  A('公共厨房', ['morning'], ['kitchen'], '帮妈抢灶眼', '我早上爬起来去公共厨房帮妈占灶眼排队');
  A('公共厨房', ['day','evening'], ['kitchen'], '帮姐择菜', '我搬个小凳坐姐旁边，帮她择菜');
  A('公共厨房', ['day'], ['kitchen'], '给苏姨搭把手', '苏姨做饭时我帮她递东西打下手');
  A('公共厨房', ['day'], ['kitchen'], '学包饺子', '我跟妈学包饺子，捏几个歪歪扭扭的');
  A('公共厨房', ['day'], ['kitchen'], '帮邻居倒垃圾', '我顺手帮张婶李婶把垃圾捎下楼');

  A('楼道·院子', ['day'], ['stairs','yard'], '找苏悦疯跑', '我去院里喊苏悦出来玩');
  A('楼道·院子', ['day','evening'], ['stairs','yard'], '陪妹跳皮筋', '我陪晓花和院里的小孩跳皮筋');
  A('楼道·院子', ['evening','night'], ['stairs','yard'], '蹲楼道找唐果贫嘴', '我拎根玉米上三楼半，跟唐果贫两句');
  A('楼道·院子', ['evening'], ['stairs','yard'], '遛遛大狗', '我带六六在巷口溜达一圈');
  A('楼道·院子', ['day'], ['stairs','yard'], '听邻居唠嗑', '我搬个板凳听张婶李婶聊楼里新鲜事');

  A('小卖部', ['day'], ['shop'], '买瓶北冰洋', '我去赵梅小卖部买瓶北冰洋');
  A('小卖部', ['day'], ['shop'], '给妹买冰棍', '我给晓花买根小豆冰棍');
  A('小卖部', ['day'], ['shop'], '帮赵梅搬货', '我帮赵梅阿姨搬箱汽水，挣点零花');
  A('小卖部', ['evening'], ['shop'], '给姐带辣条', '我给姐捎包辣条回去');

  A('公园', ['day'], ['park'], '陪妹放风筝', '我周末带晓花去公园放风筝');
  A('公园', ['day'], ['park'], '跟苏悦爬树', '我和苏悦去公园比赛爬树');
 A('公园', ['evening'], ['park'], '陪妈散步', '晚饭后我陪妈在公园遛弯');
  A('公园', ['day','evening'], ['park'], '一个人想想事', '我找个长椅躺下，盘算盘算这辈子的计划');

  A('学校', ['day'], ['school'], '认真听妈的课', '上课我坐得笔直，认真听洪老师讲课');
  A('学校', ['day'], ['school'], '陪李莉练口语', '课间我陪李莉练她那几句英语');
  A('学校', ['day'], ['school'], '帮同学看电脑', '我帮同学看看电脑/QQ出了啥毛病');
  A('学校', ['evening'], ['school'], '放学等苏悦', '放学我在校门等苏悦一起走');

  A('302室', ['day'], ['room302'], '整理杂物', '我去302室整理杂物，清点一下东西');
  A('302室', ['day'], ['room302'], '一个人待会', '我去302室躺会儿，安静想想事情');
  A('302室', ['night'], ['room302'], '藏个小秘密', '我在302室做点不想让人知道的小准备');

  A('巷口·外面', ['evening'], ['alley'], '看2008的夕阳', '我靠墙根站着，看2008年的夕阳');
  A('巷口·外面', ['day'], ['alley'], '学骑自行车', '我借赵大爷的自行车学骑车');
  A('巷口·外面', ['day'], ['alley'], '帮林秀拿东西', '我在巷口碰见林秀，帮她拎东西');

  var LOC_MAP = [
    { k: ['home'], re: /家|屋里|房间|洪家/ },
    { k: ['kitchen'], re: /厨房/ },
    { k: ['stairs','yard'], re: /楼道|走廓|楼梯|院子|楼下|水房/ },
    { k: ['shop'], re: /小卖部/ },
    { k: ['park'], re: /公园/ },
    { k: ['school'], re: /学校|教室|天台|操场|校门/ },
    { k: ['room302'], re: /302/ },
    { k: ['alley'], re: /巷|街|小区外/ }
  ];

  /* ───────────────────────────── 工具函数 ──────────────────────────── */
  function $(s, el) { return (el || document).querySelector(s); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }
  function toast(msg) {
    var t = document.getElementById('tzl_toast');
    if (!t) { t = document.createElement('div'); t.id = 'tzl_toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._tm); t._tm = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /* 发送【行动】消息给 ST */
  function sendMessage(text) {
    try {
      var ta = document.getElementById('send_textarea');
      if (!ta) { toast('没找到输入框（要在 SillyTavern 里用哦）'); return false; }
      ta.value = text;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      var btn = document.getElementById('send_but') || document.querySelector('.send_but');
      if (btn) { btn.click(); return true; }
      ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      return true;
    } catch (e) { console.error('[面板] 发送失败', e); toast('发送失败：' + e.message); return false; }
  }
  function act(msg) { sendMessage('【行动】' + msg); }

  /* ──────────────────────────── 消息解析 ──────────────────────────── */
  var lastParsed = { time: '', place: '', money: 50, roles: [], moodMap: {}, stageMap: {}, raw: '' };

  function getLatestAssistantMsg() {
    try {
      var ctx = window.SillyTavern && window.SillyTavern.getContext && window.SillyTavern.getContext();
      var chat = ctx && ctx.chat;
      if (chat && chat.length) {
        for (var i = chat.length - 1; i >= 0; i--) {
          var m = chat[i];
          if (m && !m.is_system && !m.is_hidden && !m.is_user && typeof m.message === 'string') return m.message;
        }
      }
    } catch (e) {}
    try {
      if (typeof getChatMessages === 'function') {
        var msgs = getChatMessages();
        if (msgs && msgs.length) {
          for (var j = msgs.length - 1; j >= 0; j--) {
            var mm = msgs[j];
            if (mm && mm.role === 'assistant' && typeof mm.message === 'string') return mm.message;
          }
        }
      }
    } catch (e2) {}
    return '';
  }

  function parseMessage(raw) {
    var r = { time: '', place: '', money: 50, roles: [], moodMap: {}, stageMap: {}, raw: raw || '' };
    if (!r.raw) return r;
    var v = r.raw.match(/<vintage_post>([\s\S]*?)<\/vintage_post>/);
    if (v && v[1]) {
      var tm = v[1].match(/时间[：:]\s*([^\n]+)/); if (tm) r.time = tm[1].trim();
      var lm = v[1].match(/地点[：:]\s*([^\n]+)/); if (lm) r.place = lm[1].trim();
      var rm = v[1].match(/角色[：:]\s*([\s\S]*?)(?=\n\s*文本[：:]|\n\s*\n|$)/);
      if (rm && rm[1]) {
        rm[1].split('\n').forEach(function (line) {
          var cl = line.replace(/^[\s\-\*]+/, '').trim();
          if (cl.indexOf('|') > -1) { var p = cl.split('|'); if (p[0].trim()) r.roles.push(p[0].trim()); }
        });
      }
    }
    var s = r.raw.match(/<Status_block>([\s\S]*?)<\/Status_block>/);
    if (s && s[1]) {
      var body = s[1].replace(/<\/?details?>/g, '');
      var nm = body.match(/💰\s*金钱[：:]\s*([\d.]+)/); if (nm) r.money = parseFloat(nm[1]);
      var cnRe = /^-\s*\S*\s*(洪晓彤|洪晓蕾|洪晓花|苏雨夜|苏悦|林秀|李莉|唐果|大狗)\s*$/gm;
      var cur = null; var lines = body.split('\n');
      lines.forEach(function (ln) {
        var h = ln.match(/^-\s*\S*\s*(洪晓彤|洪晓蕾|洪晓花|苏雨夜|苏悦|林秀|李莉|唐果|大狗)\s*$/);
        if (h) { cur = h[1]; return; }
        if (!cur) return;
        var mo = ln.match(/心情[：:]\s*(\d+)\/100/); if (mo) r.moodMap[cur] = parseInt(mo[1], 10);
        var st = ln.match(/攻略进度[：:]\s*第([一二三四])阶/); if (st) r.stageMap[cur] = { '一': 1, '二': 2, '三': 3, '四': 4 }[st[1]];
      });
    }
    return r;
  }

  function refresh() {
    var raw = getLatestAssistantMsg();
    if (!raw) return;
    var r = parseMessage(raw);
    lastParsed = r;
    renderStatusBar(r);
    renderFriends(r);
    renderReco(r);
  }

  /* 时段推断 */
  function timeOfDay(t) {
    if (!t) return 'day';
    if (/早晨|早上|上午/.test(t)) return 'morning';
    if (/中午|下午|白天/.test(t)) return 'day';
    if (/傍晚|黄昏/.test(t)) return 'evening';
    if (/晚上|夜晚|夜里|深夜|夜/.test(t)) return 'night';
    return 'day';
  }
  function locKeys(place) {
    var out = [];
    LOC_MAP.forEach(function (it) { if (it.re.test(place || '')) out = out.concat(it.k); });
    return out;
  }

  function pickActions(r, n) {
    n = n || 3;
    var tod = timeOfDay(r.time);
    var lks = locKeys(r.place);
    var scored = ACTIONS.map(function (a) {
      var s = 0;
      if (a.l.some(function (k) { return lks.indexOf(k) > -1; })) s += 3;
      if (a.t.indexOf(tod) > -1) s += 1;
      return { a: a, s: s };
    }).filter(function (x) { return x.s > 0; }).sort(function (x, y) { return y.s - x.s || Math.random() - 0.5; });
    var picked = [];
    var seen = {};
    for (var i = 0; i < scored.length && picked.length < n; i++) {
      if (seen[scored[i].a.label]) continue;
      seen[scored[i].a.label] = 1; picked.push(scored[i].a);
    }
    if (picked.length < n) {
      var fb = ACTIONS.filter(function (a) { return a.g === '家' && a.t.indexOf(tod) > -1; });
      for (var j = 0; j < fb.length && picked.length < n; j++) {
        if (!seen[fb[j].label]) { seen[fb[j].label] = 1; picked.push(fb[j]); }
      }
    }
    return picked.slice(0, n);
  }

  /* ───────────────────────────── UI 构建 ───────────────────────────── */
  var STYLE = '' +
    '#tzl_panel{--tz-blue:#2f6bc0;--tz-dblue:#1e4e8f;--tz-bg:#eef4fb;--tz-line:#b8d0ea;--tz-text:#1d3a5f;' +
    'position:fixed;right:14px;bottom:14px;z-index:9990;width:280px;max-width:92vw;font-family:"PingFang SC","Microsoft YaHei","SimSun",sans-serif;color:var(--tz-text);font-size:13px;line-height:1.5;}' +
    '#tzl_panel *{box-sizing:border-box;margin:0;padding:0;}' +
    '#tzl_panel .tzl-pill{display:none;width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3f8efc,#2456c1);border:2px solid #fff;box-shadow:0 4px 14px rgba(30,80,180,.45);color:#fff;font-size:12px;font-weight:700;cursor:pointer;align-items:center;justify-content:center;flex-direction:column;text-align:center;}' +
    '#tzl_panel .tzl-pill .p1{font-size:18px;}' +
    '#tzl_panel.hidden-p .tzl-pill{display:flex;}' +
    '#tzl_panel.hidden-p .tzl-win{display:none;}' +
    '#tzl_panel .tzl-win{background:var(--tz-bg);border:1px solid var(--tz-line);border-radius:6px;box-shadow:0 8px 28px rgba(20,60,120,.28);overflow:hidden;display:flex;flex-direction:column;max-height:72vh;}' +
    '#tzl_panel .tzl-title{background:linear-gradient(180deg,#3f86d8,#2f6bc0);color:#fff;padding:6px 10px;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:space-between;}' +
    '#tzl_panel .tzl-title .t{display:flex;align-items:center;gap:6px;}' +
    '#tzl_panel .tzl-title .ttl{background:rgba(255,255,255,.15);border:none;color:#fff;width:22px;height:22px;border-radius:3px;cursor:pointer;font-size:12px;line-height:1;font-family:inherit;}' +
    '#tzl_panel .tzl-status{background:#f7fbfe;border-bottom:1px solid var(--tz-line);padding:5px 10px;font-size:12px;color:#4a6a8f;display:flex;flex-wrap:wrap;gap:2px 8px;align-items:center;}' +
    '#tzl_panel .tzl-reco{background:#fff8ee;border-bottom:1px solid #eadab0;padding:6px 10px;}' +
    '#tzl_panel .tzl-reco .t{font-size:12px;color:#9a6a0f;margin-bottom:4px;}' +
    '#tzl_panel .tzl-tabs{display:flex;background:#e3eef9;border-bottom:1px solid var(--tz-line)}' +
    '#tzl_panel .tzl-tab{flex:1;text-align:center;padding:7px 2px;font-size:12px;cursor:pointer;color:#3a6397;border:none;background:none;font-family:inherit;}' +
    '#tzl_panel .tzl-tab.on{background:#fff;color:#1e4e8f;font-weight:700;box-shadow:inset 0 -2px 0 var(--tz-blue);}' +
    '#tzl_panel .tzl-content{overflow-y:auto;overflow-x:hidden;background:#fff;min-height:120px;}' +
    '#tzl_panel .tzl-page{display:none;padding:8px;}' +
    '#tzl_panel .tzl-page.on{display:block;}' +
    '#tzl_panel .grp{font-size:12px;font-weight:700;color:#2f6bc0;background:#e8f1fb;padding:4px 8px;margin:6px 0 2px;border-left:3px solid var(--tz-blue);cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center;}' +
    '#tzl_panel .grp .arw{font-size:10px;color:#8a8aa8;}' +
    '#tzl_panel .fr-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:4px;cursor:pointer;}' +
    '#tzl_panel .fr-row:hover{background:#e8f2fd;}' +
    '#tzl_panel .fr-ava{width:36px;height:36px;border-radius:6px;background:#dce7f5;display:flex;align-items:center;justify-content:center;font-size:17px;color:#2f6bc0;border:1px solid #b8d0ea;overflow:hidden;flex-shrink:0;position:relative;}' +
    '#tzl_panel .fr-ava img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '#tzl_panel .fr-info{flex:1;min-width:0;}' +
    '#tzl_panel .fr-name{font-weight:700;font-size:13px;}' +
    '#tzl_panel .fr-rel{font-size:11px;color:#7a92ac;}' +
    '#tzl_panel .fr-st{font-size:11px;color:#4a8f4e;}' +
    '#tzl_panel .fr-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}' +
    '#tzl_panel .fr-stg{font-size:10px;background:#eef4fb;border:1px solid #b8d0ea;color:#2f6bc0;padding:1px 6px;border-radius:8px;}' +
    '#tzl_panel .card{background:#fbfdff;border:1px solid var(--tz-line);border-radius:6px;padding:10px;margin:8px 0;box-shadow:0 2px 8px rgba(30,80,150,.08);}' +
    '#tzl_panel .card h4{font-size:13px;color:#1e4e8f;margin-bottom:6px;}' +
    '#tzl_panel .card .stage{font-size:12px;color:#c0881d;font-weight:700;margin-bottom:6px;}' +
    '#tzl_panel .card ul{list-style:none;margin:0 0 8px;}' +
    '#tzl_panel .card li{font-size:12px;color:#405a75;padding:1px 0 1px 14px;position:relative;}' +
    '#tzl_panel .card li:before{content:"·";position:absolute;left:2px;color:#8aa6c4;}' +
    '#tzl_panel .card .tip{font-size:11px;color:#7a92ac;margin-top:6px;}' +
    '#tzl_panel .qbtn{display:inline-block;background:#eef4fb;border:1px solid #9bb8da;color:#2b5797;border-radius:12px;padding:3px 10px;font-size:12px;cursor:pointer;margin:2px 4px 2px 0;font-family:inherit;transition:all .15s;}' +
    '#tzl_panel .qbtn:hover{background:#d6e6f8;border-color:#5d8fd0;}' +
    '#tzl_panel .qbtn:active{transform:scale(.96);}' +
    '#tzl_panel .goal-row{background:#f8fbff;border:1px solid #dbe6f4;border-radius:6px;padding:7px 10px;margin-bottom:6px;cursor:pointer;}' +
    '#tzl_panel .goal-row:hover{background:#eaf3fd;}' +
    '#tzl_panel .goal-row .gt{font-size:13px;font-weight:600;color:#1d3a5f;}' +
    '#tzl_panel .goal-row .gm{font-size:11px;color:#7a92ac;margin-top:2px;}' +
    '#tzl_panel .go-cat{margin:8px 0 4px;font-size:12px;font-weight:700;color:#c0881d;}' +
    '#tzl_panel .help-body{font-size:12px;color:#405a75;}' +
    '#tzl_panel .help-body h4{color:#1e4e8f;margin:10px 0 4px;font-size:13px;}' +
    '#tzl_panel .help-body p{margin:3px 0;}' +
    '#tzl_panel .help-body code{background:#e8f1fb;padding:1px 6px;border-radius:3px;color:#2f6bc0;font-family:inherit;}' +
    '#tzl_panel .tzl-foot{background:#e8f1fb;border-top:1px solid var(--tz-line);padding:4px 10px;font-size:11px;color:#6a8aa8;text-align:center;}' +
    '#tzl_toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:rgba(30,60,100,.9);color:#fff;padding:8px 16px;border-radius:6px;font-size:13px;z-index:10001;opacity:0;pointer-events:none;transition:opacity .25s;}' +
    '#tzl_toast.show{opacity:1;}' +
    '@media (max-width:480px){#tzl_panel{right:6px;bottom:6px;width:94vw;}}';

  var win = null;

  function buildPanel() {
    var host = document.getElementById('tzl-mount') || document.body;
    var div = document.createElement('div');
    div.id = 'tzl_panel';
    div.innerHTML = '\
      <div class="tzl-win">\
        <div class="tzl-title"><span class="t">🐧 <b>QQ 2008 · 幸福里3号楼</b> <span style="font-weight:400;font-size:11px;opacity:.8">v' + VERSION + '</span></span>\
        <span><button class="ttl" title="收起" id="tzl_coll">–</button><button class="ttl" title="藏起" id="tzl_hide">×</button></span></div>\
        <div class="tzl-status" id="tzl_st"></div>\
        <div class="tzl-reco" id="tzl_reco" style="display:none"></div>\
        <div class="tzl-tabs">\
          <button class="tzl-tab on" data-p="fr">👥 好友</button>\
          <button class="tzl-tab" data-p="goal">🎯 目标</button>\
          <button class="tzl-tab" data-p="act">⚡ 行动</button>\
          <button class="tzl-tab" data-p="help">❓ 说明</button></div>\
        <div class="tzl-content">\
          <div class="tzl-page on" data-page="fr" id="tzl_fr"></div>\
          <div class="tzl-page" data-page="goal" id="tzl_go"></div>\
          <div class="tzl-page" data-page="act" id="tzl_act"></div>\
          <div class="tzl-page" data-page="help" id="tzl_help"></div>\
        </div>\
        <div class="tzl-foot">点按钮自动发送【行动】· 打「面板」可重新唤出</div>\
      </div>\
      <div class="tzl-pill" id="tzl_pill"><span class="p1">🐧</span>QQ<br>2008</div>\
    ';
    host.appendChild(div);
    win = div;

    $$('.tzl-tab', div).forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.tzl-tab', div).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        $$('.tzl-page', div).forEach(function (p) { p.classList.toggle('on', p.dataset.page === b.dataset.p); });
      });
    });
    document.getElementById('tzl_coll').addEventListener('click', function () {
      div.classList.add('hidden-p'); localStorage.setItem('tzl_panel_hidden', '1');
    });
    document.getElementById('tzl_hide').addEventListener('click', function () {
      div.classList.add('hidden-p'); localStorage.setItem('tzl_panel_hidden', '1');
    });
    document.getElementById('tzl_pill').addEventListener('click', function () {
      div.classList.remove('hidden-p'); localStorage.removeItem('tzl_panel_hidden');
    });
    if (localStorage.getItem('tzl_panel_hidden') === '1') div.classList.add('hidden-p');

    renderGoals();
    renderActions();
    renderHelp();
    refresh();
  }

  function show() {
    if (win) { win.classList.remove('hidden-p'); localStorage.removeItem('tzl_panel_hidden'); }
  }

  function hide() { if (win) win.classList.add('hidden-p'); }

  /* ─────────────────────────── 渲染 ─────────────────────────── */
  function moodMeta(v) {
    if (v >= 80) return { c: '#2ecc71', t: '开心在线' };
    if (v >= 60) return { c: '#27ae60', t: '在线' };
    if (v >= 40) return { c: '#f39c12', t: '离开' };
    return { c: '#e74c3c', t: '忙碌' };
  }

  function renderStatusBar(r) {
    var el = document.getElementById('tzl_st');
    if (!el) return;
    var mm = moodMeta(70);
    el.innerHTML = '\
      <span>🕓 ' + esc(r.time || '2008年04月05日 星期六 早晨') + '</span>\
      <span>📍 ' + esc(r.place || '北京 · 筒子楼') + '</span>\
      <span>💰 ' + esc(r.money) + ' 元</span>\
      <span>心情<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + mm.c + ';margin:0 3px;"></span>' + mm.t + '</span>';
  }

  function renderFriends(r) {
    var el = document.getElementById('tzl_fr');
    if (!el) return;
    var html = '';
    GROUPS.forEach(function (g) {
      var list = CHARS.filter(function (c) { return c.group === g; });
      if (!list.length) return;
      html += '<div class="grp" data-g="' + g + '">' + g + '<span class="arw">▼</span></div>';
      html += '<div class="grp-list" data-g="' + g + '">';
      list.forEach(function (c) {
        var mood = r.moodMap[c.name];
        var mm = mood != null ? moodMeta(mood) : { c: '#93a7bd', t: '离线' };
        var stg = r.stageMap[c.name] || 1;
        var ava = '<div class="fr-ava"><img src="' + BASE + '/' + c.pin + '_uniform_1.png" alt="" loading="lazy" onerror="this.remove()"><span style="font-size:17px">' + c.name.charAt(0) + '</span></div>';
        html += '\
          <div class="fr-row" data-name="' + c.name + '">\
            ' + ava + '\
            <div class="fr-info">\
              <div class="fr-name">' + c.name + ' <span class="fr-rel">' + c.rel + '</span></div>\
              <div class="fr-st">' + c.desc + '</div>\
            </div>\
            <div style="text-align:right">\
              <span class="fr-dot" style="background:' + mm.c + '" title="' + mm.t + '"></span>\
              <div class="fr-stg" style="margin-top:3px">' + STAGES[stg].name + '</div>\
            </div>\
          </div>\
          <div class="card" data-card="' + c.name + '" style="display:none">' + buildCharCard(c, stg, r) + '</div>';
      });
      html += '</div>';
    });
    el.innerHTML = html;

    $$('.grp', el).forEach(function (g) {
      g.addEventListener('click', function () {
        var list = el.querySelector('.grp-list[data-g="' + g.dataset.g + '"]');
        if (!list) return;
        var open = list.style.display !== 'none';
        list.style.display = open ? 'none' : 'block';
        g.querySelector('.arw').textContent = open ? '▶' : '▼';
      });
    });
    $$('.fr-row', el).forEach(function (row) {
      row.addEventListener('click', function () {
        var name = row.dataset.name;
        var card = el.querySelector('.card[data-card="' + name + '"]');
        if (!card) return;
        var open = card.style.display !== 'none';
        card.style.display = open ? 'none' : 'block';
        $$('.card', el).forEach(function (c) { if (c !== card) c.style.display = 'none'; });
      });
    });
  }

  function buildCharCard(c, stg, r) {
    var st = STAGES[stg];
    var acts = (CHAR_ACTS[c.name] && CHAR_ACTS[c.name][stg]) || [];
    var h = '<h4>' + c.name + ' · 攻略卡</h4>';
    h += '<div class="stage">当前：' + st.name + '</div>';
    h += '<ul>' + st.can.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>';
    if (acts.length) {
      h += '<div style="font-size:12px;color:#1d3a5f;margin:4px 0 2px">此刻可以试着：</div>';
      acts.forEach(function (a) { h += '<button class="qbtn" data-act="' + esc(a[1]) + '">' + a[0] + '</button>'; });
      h += '<div style="font-size:11px;color:#93a7bd;margin-top:4px">关系更近后，会有更多可做的事。别急，慢慢处。</div>';
    }
    h += '<div class="tip">注：她本人不知道「阶段」，剧情里别提这一层。</div>';
    return h;
  }

  function renderReco(r) {
    var el = document.getElementById('tzl_reco');
    if (!el) return;
    var picked = pickActions(r, 3);
    if (!picked.length) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.innerHTML = '<div class="t">✦ 此刻推荐</div>' + picked.map(function (a) {
      return '<button class="qbtn" data-act="' + esc(a.msg) + '">' + a.label + '</button>';
    }).join('');
    $$('.qbtn', el).forEach(function (b) {
      b.addEventListener('click', function () { act(b.dataset.act); });
    });
  }

  /* ─────────────────────────── 渲染：目标/行动/说明 ─────────────────────────── */
  function renderGoals() {
    var el = document.getElementById('tzl_go');
    if (!el) return;
    var h = '';
    GOALS.forEach(function (g) {
      h += '<div class="go-cat">' + g.cat + '</div>';
      g.items.forEach(function (it) {
        h += '<div class="goal-row" data-m="' + esc(it.m) + '"><div class="gt">' + it.t + '</div><div class="gm">' + it.m + '</div></div>';
      });
    });
    el.innerHTML = h;
    $$('.goal-row', el).forEach(function (row) {
      row.addEventListener('click', function () { act(row.dataset.m); });
    });
  }

  function renderActions() {
    var el = document.getElementById('tzl_act');
    if (!el) return;
    var groups = {};
    ACTIONS.forEach(function (a) { (groups[a.g] = groups[a.g] || []).push(a); });
    var h = '';
    Object.keys(groups).forEach(function (g) {
      h += '<div class="grp" data-g2="' + g + '">' + g + '<span class="arw">▼</span></div>';
      h += '<div class="grp-list2" data-g2="' + g + '">';
      groups[g].forEach(function (a) {
        h += '<button class="qbtn" data-act="' + esc(a.msg) + '">' + a.label + '</button>';
      });
      h += '</div>';
    });
    el.innerHTML = h;
    $$('.grp', el).forEach(function (g) {
      g.addEventListener('click', function () {
        var list = el.querySelector('.grp-list2[data-g2="' + g.dataset.g2 + '"]');
        if (!list) return;
        var open = list.style.display !== 'none';
        list.style.display = open ? 'none' : 'block';
        g.querySelector('.arw').textContent = open ? '▶' : '▼';
      });
    });
    $$('.qbtn', el).forEach(function (b) {
      b.addEventListener('click', function () { act(b.dataset.act); });
    });
  }

  function renderHelp() {
    var el = document.getElementById('tzl_help');
    if (!el) return;
    el.innerHTML = '\
      <div class="help-body">\
        <h4>🎮 这是什么</h4>\
        <p>你是四十岁的大叔，魂穿回 2008 年十二岁的自己。这辈子的目标：<code>把上辈子没来得及的陪伴，全补回来</code>。</p>\
        <h4>🤖 面板怎么用</h4>\
        <p>1. 点下面的 <code>按钮</code>，它们会自动替你发一句话（以<code>【行动】</code>开头），AI 会正常演下去。</p>\
        <p>2. 想干嘛就干嘛，自由打字更好玩。<code>【行动】</code>只是快捷方式。</p>\
        <h4>👥 好友页</h4>\
        <p>点开每个人，能看到<code>当前阶段·可以做什么</code>。关系是一点一点处出来的。</p>\
        <h4>🎯 目标页</h4>\
        <p>短/中/长线目标，不知道干嘛就点一个。</p>\
        <h4>⚠️ 三条规矩</h4>\
        <p>· 面板只给日常和陪伴的按钮。更亲密的事，要靠感情到位+对方乐意——游戏有<code>合理性审查</code>，拒绝永远有效，硬来会把关系搞砸。</p>\
        <p>· 兜里就 50 块，买东西真扣钱。</p>\
        <p>· 面板丢了？输入框打<code>面板</code>或<code>帮助</code>，它就会回来。</p>\
        <h4>🔧 小贴士</h4>\
        <p>「此刻推荐」会跟着时间和地点变：早晨在家、傍晚在楼道、上课在教室……</p>\
      </div>\
    ';
  }

  /* ─────────────────────────── 启动 ─────────────────────────── */
  function init() {
    var st = document.createElement('style');
    st.textContent = STYLE;
    document.head.appendChild(st);
    buildPanel();

    try {
      if (window.tavern_events && window.tavern_events.on) {
        window.tavern_events.on(window.tavern_events.MESSAGE_RECEIVED, function () { setTimeout(refresh, 300); });
      }
    } catch (e) {}

    var lastRaw = '';
    setInterval(function () {
      var raw = getLatestAssistantMsg();
      if (raw && raw !== lastRaw) { lastRaw = raw; refresh(); }
    }, 4000);

    window.__tzl_panel__ = { show: show, hide: hide, refresh: refresh, version: VERSION };
    console.log('[QQ2008面板] 已挂载 v' + VERSION);
  }

  /* 供调试 / 外部扩展读取的数据出口（不影响正常流程） */
  try { window.__tzl_panel_data__ = { CHARS: CHARS, GROUPS: GROUPS, STAGES: STAGES, CHAR_ACTS: CHAR_ACTS, DOG_ACTS: DOG_ACTS, GOALS: GOALS, ACTIONS: ACTIONS }; } catch (e) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();