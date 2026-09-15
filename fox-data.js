(function(global){
  'use strict';
  const d=global.LG01_DATA, all=d.groups.flatMap(g=>g.pages), map=Object.fromEntries(all.map(p=>[p.n,p]));
  d.version='Fox purchased-food revision 2026-09-14';d.summary='菜单、交友与喂养复查；喂养消耗 App 已购库存，补齐库存同步恢复与好友邀请终态。';
  const action=(label,event,target,tone='primary',actionRole='command')=>({label,event,target,tone,actionRole});
  const route=(label,event,target,guard='当前页面和会话有效',effect='更新当前对象并展示结果')=>({label,event,target,guard,effect});
  function add(n,title,kind,ui,summary,edge){
    map[n]={n,title,type:kind,status:'新增',tag:'Fox 完整交互',summary,trigger:'从所属模块进入或在页面目录中查看',feedback:'操作后显示结果；返回保留已提交数据。',edge,ui:{kind,label:'',text:'',sub:'',actions:[],items:[],tone:'dark',...ui}};
    d.transitions[n]=[];
  }
  d.deviceLanguages=[{value:'en',label:'English'},{value:'zh-CN',label:'简体中文'},{value:'zh-TW',label:'繁體中文'},{value:'de',label:'Deutsch'},{value:'fr',label:'Français'},{value:'es',label:'Español'}];
  add('178','语言选择','choices',{label:'Language',text:'',actions:[action('Continue','LANGUAGE_DONE','02')],items:d.deviceLanguages.map(item=>({...item,event:'LANGUAGE_SET'}))},'首次开机与设置共用六项语言列表；上下滑动选择，再点击继续。','本次仅补齐繁中、德语、法语和西班牙语选项与选中态，整套画面暂不翻译。选中这四项后仍用当前简中或英文预览，不代表已完成本地化。');
  add('180','设置总览','list',{label:'Settings',items:[{label:'Quick controls',icon:'SlidersHorizontal',target:'75',event:'NAVIGATE'},{label:'Wi-Fi',icon:'Wifi',target:'83',event:'OPEN_WIFI'},{label:'Language',icon:'Languages',target:'178',event:'LANGUAGE_OPEN'},{label:'My character',icon:'Smile',target:'186',event:'CHARACTER_PICKER'},{label:'Memories',icon:'Link',target:'29',event:'NAVIGATE'},{label:'About',icon:'Info',target:'181',event:'NAVIGATE'}]},'设置页覆盖原 UI 的亮度、音量、静音、配网、语言和关于入口，补充记忆同步。','完整列表上下滚动，标题与返回固定，无可见滚动条或翻页控件；不使用系统默认下拉菜单。');
  add('181','关于设备','list',{label:'About',text:'LG01',items:[{label:'Software',sub:'UI prototype · 2026.09.12',event:'NOOP'},{label:'Model',sub:'LG01',event:'NOOP'},{label:'Update',icon:'Download',event:'NAVIGATE',target:'163'},{label:'Power off',icon:'Power',event:'POWER_CONFIRM',target:'118'}]},'显示设备信息；进入更新检查或关机确认。','版本值为演示信息，不读取真实设备。');
  add('182','录音播放详情','status',{label:'Voice note',text:'Voice note',actions:[]},'从已保存录音列表选择记录，播放、暂停、回放进度与删除。','录音和播放均为本地状态演示；不调用麦克风、不上传、不伪装真实语音内容。');
  add('183','删除已保存录音确认','choices',{label:'Voice note',text:'Delete this recording?',sub:'This cannot be undone.',actions:[action('Keep','RECORD_KEEP','182','secondary','keep'),action('Delete','RECORD_DELETE','124','danger','destructive')]},'删除指定已保存的演示记录；保留动作在左，删除在右。','以 recordId 锁定当前记录，重复删除不影响其他记录。');
  add('184','录音已暂停','recorder',{label:'Voice note',text:'Paused',actions:[action('Save','REC_SAVE_PAUSED','122','secondary'),action('Resume','REC_RESUME','71')]},'沿用原 UI 的暂停/继续功能，不丢失当前录音时长。','静音、录音冲突、恢复后保留草稿；达到 60 秒走已有保存状态。');
  add('185','好友菜单','list',{label:'Friends',items:[{label:'My friends',icon:'Users',event:'NAVIGATE',target:'191'},{label:'Friend messages',icon:'Mail',event:'NAVIGATE',target:'165'}]},'好友菜单提供固定功能入口，具体好友独立放在我的好友列表中。','社交默认未授权；原型侧栏明确模拟家长允许后方可执行，绝不以儿童按钮伪造授权。');
  add('191','我的好友','list',{label:'My friends',items:[{label:'Milo',icon:'Users',event:'FRIEND_OPEN',target:'56'}]},'集中展示已确认好友；多个好友上下滚动，点击进入对应好友详情。','无好友时显示空状态与碰一碰入口，不制造好友；返回列表保留滚动位置，好友身份和宠物名称分别显示。');
  map['191'].trigger='P185 好友菜单中的我的好友。';map['191'].feedback='选择好友进入 P56；详情返回 P191，列表返回 P185。空列表碰一碰取消后仍返回本列表。';
  d.transitions['191']=[route('查看所选好友','FRIEND_OPEN','56'),route('暂无好友，碰一碰交友','PEER_DISCOVERY_OPEN','54','列表为空且社交已授权'),route('返回好友菜单','BACK','185')];
  add('186','选择伙伴','choices',{label:'My character',text:'Choose a companion',actions:[action('Use character','COMPANION_COMMIT','07')]},'复用 Lumi / Pico / Momo 三个预置伙伴，并列出已经成功启用的本地生成伙伴；选择仅为待确认状态。','首次设置确认后进入欢迎页；设置来源确认后返回待机、取消返回设置；伙伴页来源确认或取消均返回 P93。仅云端生成或待启用的伙伴不能绕过资源校验加入列表。');
  map['01'].summary='原 Fox 开机画面；自检后首次进入语言选择，已设置设备回到待机。';
  map['01'].edge='首次未选语言进入 P178；已选语言但未连接主设备进入 P02；设置未完成时按当前进度直达下一步；已完成进入 P10；自检失败进入 P101。';
  map['108'].summary='更多功能使用完整纵向列表，上下滑动查看步数、好友动态、录音和继续设置等条目。';
  map['108'].trigger='从环形菜单的更多入口进入，或从页面目录直接查看。';
  map['108'].feedback='点击条目进入对应功能；滚动仅移动列表，不翻页、不触发页面手势。';
  map['108'].edge='标题和返回按钮固定；返回列表保留滚动位置，滑动结束不误触条目。';
  d.transitions['01'][0]=route('首次开机','BOOT_UNBOUND','178');
  d.transitions['178']=[route('确认语言','LANGUAGE_DONE','02')];
  map['02'].ui.sub='Scan with the LUMIQ app';
  map['02'].title='设备连接';
  map['02'].summary='小圆屏显示二维码供 LUMIQ 应用扫码，随后在圆屏确认连接主设备。';
  map['02'].edge='二维码不失效，无倒计时、刷新或失效页。扫码只发起主设备连接请求，仍需圆屏确认；请求确认保留 60 秒超时与会话校验。演示码不是生产凭据，也不授予永久访问权限。';
  d.transitions['02']=[route('模拟扫码发起主设备连接','BIND_REQUEST','03')];
  map['03'].title='确认连接主设备';map['03'].ui.label='Device setup';map['03'].ui.text='Connect main device?';map['03'].ui.sub='Check the device nearby';
  map['03'].summary='确认的是主设备连接，不是手机连接；左侧暂不，右侧连接。';map['03'].trigger='扫码后收到有效的主设备连接请求。';map['03'].feedback='确认后进入 P04；暂不或超时不写入绑定。';map['03'].edge='仅当前请求可确认，60 秒超时进入 P37；主设备发现与认证协议由设备端实现。';
  d.transitions['03']=[route('同意连接主设备','BIND_ACCEPT','04'),route('暂不连接','BIND_DECLINE','02'),route('请求超时','BIND_TIMEOUT','37')];
  map['04'].title='正在连接设备';map['04'].ui.text='Connecting to device';map['04'].ui.sub='Keep device nearby';
  map['04'].summary='显示小圆屏与主设备正在建立连接。';map['04'].trigger='P03 确认当前主设备连接请求。';map['04'].feedback='成功后在 P05 选择网络；连接未完成进入 P37 超时页。';map['04'].edge='连接结果必须匹配当前会话，取消后的迟到回执不生效；主设备通信协议不在本原型中模拟实现。';
  d.transitions['04']=[route('主设备连接成功','BIND_SUCCESS','05'),route('连接超时','BIND_FAILED','37')];
  for(const id of ['37','38']){map[id].ui.label='Device setup';map[id].ui.sub='Keep device nearby';map[id].feedback='返回二维码页重新发起主设备连接；不跳过用户确认。';}
  map['37'].title='设备连接超时';map['37'].ui.text='连接超时';
  map['37'].trigger='主设备连接请求在有效时间内未完成。';
  map['37'].feedback='点击“再试一下”重新连接设备；取消后回到二维码。';
  map['37'].edge='超时不会写入绑定；重试创建新的连接尝试。';
  map['37'].ui.actions=[{...action('Back','PROVISION_CANCEL','02','secondary','back'),icon:'ArrowLeft',iconOnly:true},action('再试一下','BIND_RETRY','04')];
  d.transitions['37']=[route('再试一下','BIND_RETRY','04'),route('返回二维码','PROVISION_CANCEL','02')];
  const wifiItems=map['109'].ui.items.map(item=>({...item,icon:item.event==='WIFI_SELECT_OPEN'?'Wifi':'LockKeyhole',sub:''}));
  const rescan={...action('Search again','WIFI_SCAN','126'),icon:'Search',iconOnly:true};
  map['05'].type='list';map['05'].title='在小圆屏选择网络';
  map['05'].ui={kind:'list',label:'Choose network',text:'',sub:'',tone:'dark',items:wifiItems.map(item=>({...item})),actions:[]};
  map['05'].summary='主设备连接成功后，在小圆屏上下滑动选择无线网络；点击加密网络直接进入密码输入。网络行只显示名称和锁图标，不显示“需要密码”。';map['05'].trigger='当前主设备连接成功，已有扫描结果。';map['05'].feedback='加密网络进入 P110 输入密码；开放网络直接连接。';map['05'].edge='演示网络列表为本地样例；真实设备必须返回扫描结果后再显示。空列表或网络消失时在恢复页重新搜索。';
  d.transitions['05']=[route('选择加密网络','WIFI_SELECT','110'),route('选择开放网络','WIFI_SELECT_OPEN','111'),route('所选网络消失','WIFI_LOST','129')];
  map['109'].title='更换无线网络';map['109'].ui.label='Choose network';map['109'].ui.text='';map['109'].ui.items=wifiItems;map['109'].ui.actions=[rescan];
  map['109'].summary='在设置中上下滑动选择网络，所有结果在同一列表，不使用列表分页。';map['109'].edge='取消保留此前有效连接与角色；同名网络的标识和安全类型需网络模块提供。';
  d.transitions['109']=d.transitions['109'].filter(r=>r.event!=='WIFI_SKIP');
  map['110'].feedback='在圆屏键盘输入密码，支持大小写、数字、符号、空格、删除和显示/隐藏；每组 12 个字符键。';
  map['111'].summary='使用小圆屏所选网络和输入的密码连接；开放网络无需密码。';map['111'].ui.sub='';map['111'].ui.hideNetworkName=true;
  map['111'].feedback='只保留连接状态和取消按钮，不重复显示网络名；取消回到本次来源列表。';
  map['112'].ui.sub='';map['112'].ui.actions=[action('Continue','WIFI_CONTINUE','186')];map['112'].feedback='只显示连接成功；首次继续进入 P186 预置角色，设置换网则回到 P83。';
  d.transitions['112']=[route('首次继续选角色','WIFI_CONTINUE','186','首次设置且网络已连接'),route('设置完成','WIFI_SETTINGS_DONE','83','设置来源且网络已连接')];
  map['113'].ui.actions=[action('Choose network','WIFI_BACK','109','secondary'),action('Try again','WIFI_RETRY','111')];
  map['113'].feedback='重试当前连接，或重新选网；取消/返回不会要求重新扫码。';
  d.transitions['113']=[route('重试连接','WIFI_RETRY','111'),route('重新选网','WIFI_BACK','109'),route('取消配网','WIFI_CANCEL','83')];
  map['126'].feedback='扫描结果按来源进入 P05 或 P109；无结果进入 P127。';
  d.transitions['126']=[route('扫描找到网络','WIFI_SCAN_RESULT','109'),route('没有找到网络','WIFI_SCAN_EMPTY','127'),route('取消扫描','WIFI_CANCEL','83')];
  map['127'].summary='扫描完成但附近没有受支持的网络，可重新搜索或返回。';map['127'].feedback='重新搜索进入 P126；首次返回 P05 重新选择，设置来源返回 P83。';map['127'].edge='空状态不假装连接成功；首版不支持隐藏网络与企业认证。';
  d.transitions['127']=d.transitions['127'].filter(r=>r.event!=='WIFI_SKIP');
  map['128'].title='无线网络密码错误';map['128'].ui.text='Password did not work';map['128'].ui.sub='';
  map['128'].summary='密码认证失败后直接在小圆屏修改密码。';map['128'].feedback='修改密码回 P110；返回按首次/设置来源回 P05/P109，不再要求手机修改。';map['128'].edge='错误密码清空，不自动重试；不写入日志、页面地址或浏览快照。';
  map['115'].ui.actions=map['115'].ui.actions.map(a=>a.event==='WIFI_ON'?{...a,target:'126'}:a);
  d.transitions['115']=d.transitions['115'].map(r=>r.event==='WIFI_ON'?{...r,target:'126',effect:'开启无线网络并在设备上搜索'}:r);
  map['130'].feedback='历史恢复页已移除；开机或配网中断时按当前进度直接进入下一步。';
  map['130'].edge='当前版本不展示确认页；配网完成后按当前进度继续，后续仍可在设置中更换网络。';
  d.transitions['130']=d.transitions['130'].map(r=>r.event==='SETUP_DEFAULT'?{...r,guard:'已确认主设备且预置资源可用',effect:'明确选择本地使用，标记 networkSkipped，保留后续在设置中联网入口'}:r);
  map['78'].ui.actions=map['78'].ui.actions.map(a=>a.event==='CLOUD_USE_LOCAL'?{...a,label:'Continue'}:a);map['78'].edge='首次网络已连但云端不可用时，可继续选择预置角色；不引导重复输入正确密码。';
  map['157'].feedback='满值或冷却中使用友好反馈和“好的”返回；条件恢复后显示对应可执行动作，不催促无效重试。';
  map['157'].ui.actions=[action('OK','PET_UNAVAILABLE_DONE','93')];
  d.transitions['157']=d.transitions['157'].map(r=>({...r,label:r.event==='BACK'?'好的，返回照顾':r.label.replace('重试对应动作','继续对应动作')}));
  d.transitions['157'].unshift(route('好的','PET_UNAVAILABLE_DONE','93'));
  for(const id of ['02','03','04','05','37','38','83','109','110','111','112','113','115','126','127','128','129','130','157','174','178','182'])map[id].tag='主设备配网与交互修订';
  delete map['06'];delete d.transitions['06'];
  for(const page of Object.values(map))for(const item of [...page.ui.actions,...page.ui.items])if(item.target==='06')item.target='186';
  for(const routes of Object.values(d.transitions))for(const item of routes)if(item.target==='06')item.target='186';
  d.transitions['180']=map['180'].ui.items.map(i=>route(i.label,i.event,i.target));
  d.transitions['181']=map['181'].ui.items.filter(i=>i.target).map(i=>route(i.label,i.event,i.target));
  d.transitions['182']=[route('播放或暂停','RECORD_PLAY','182'),route('删除确认','RECORD_DELETE_OPEN','183'),route('返回记录列表','RECORD_LIST','124')];
  d.transitions['183']=[route('保留','RECORD_KEEP','182'),route('删除此记录','RECORD_DELETE','124')];
  d.transitions['184']=[route('继续录音','REC_RESUME','71'),route('保存','REC_SAVE_PAUSED','122'),route('退出录音处置','REC_BACK','125')];
  d.transitions['71'].push(route('暂停录音','REC_PAUSE','184'));
  d.transitions['70'].push(route('已存录音','NAVIGATE','124'));
  d.transitions['185']=[route('我的好友','NAVIGATE','191'),route('好友消息','NAVIGATE','165')];
  d.transitions['186']=[route('首次使用所选伙伴','COMPANION_COMMIT','07','首次设置来源，所选伙伴本地可用','确认后进入首次问候'),route('设置中更换伙伴','COMPANION_COMMIT','10','设置来源，所选伙伴本地可用','沿用设置更换后返回待机的现有流程'),route('切换并返回我的伙伴','COMPANION_COMMIT','93','来自 P93 我的伙伴，所选伙伴本地可用','启用所选伙伴并显示该伙伴独立的等级和照顾状态'),route('取消切换，返回我的伙伴','COMPANION_CANCEL','93','来自 P93 我的伙伴','放弃未确认选择，保留当前伙伴及其状态'),route('取消更换，返回设置','COMPANION_CANCEL','180','设置来源','放弃未确认选择，保留当前伙伴')];
  map['186'].trigger='首次联网完成、设置中的我的角色，或 P93 我的伙伴中的切换伙伴。';
  map['186'].feedback='选择后点击使用角色才提交；从我的伙伴进入时，确认和取消均返回 P93，取消不更换当前伙伴。首次设置不显示取消，仍按原流程进入问候。';
  d.transitions['74'].push(route('设置','NAVIGATE','180'),route('好友','NAVIGATE','185'),route('更多功能','NAVIGATE','108'));
  // Copy changes keep protocol events, targets and permission rules intact.
  const copyUpdates={
    '07':{text:"Hi, I'm {characterName}"},
    '09':{text:'Good to see you'},
    '17':{text:'Something to share',sub:'From daily content'},
    '18':{label:'Growth',text:'Level up',sub:'Level {characterLevel}'},
    '21':{sub:'Connect to chat again'},
    '41':{text:'I missed that'},
    '43':{text:'I could not answer this time'},
    '44':{text:"Let's try another topic"},
    '55':{text:'Be friends with Milo?',sub:''},
    '58':{label:'Companion',text:"I'm keeping you company",sub:''},
    '59':{label:'Companion',text:'Shall we take a break?',sub:''},
    '60':{label:'Companion',text:'Breathe slowly with me'},
    '61':{label:'Companion',text:'One slow breath'},
    '62':{label:'Companion',text:'Take a little pause'},
    '63':{label:'Companion',text:'It is OK to take a break'},
    '64':{label:'Companion',text:'Rest a moment first'},
    '65':{label:'Companion',text:'Breathe with the stars'},
    '66':{label:'Companion',text:'Talk to a trusted adult'},
    '68':{text:'',sub:''},
    '70':{text:'What would you like to remember?'},
    '73':{label:'Voice note',text:'Recording not saved yet'},
    '76':{text:'Thanks for chatting',sub:''},
    '77':{label:'Messages',text:'',sub:'No new messages yet'},
    '78':{text:'Service is not connected',sub:'Try again later'},
    '82':{label:'Companion',text:'Want me to keep you company?',sub:'Mic will be on for 30 min'},
    '94':{text:'Snack time',sub:''},
    '95':{text:'Time to freshen up',sub:''},
    '102':{text:'No result yet',sub:''},
    '103':{label:'Today',sub:''},
    '108':{text:'',sub:''},
    '123':{text:'Recording saved'},
    '129':{text:'Network is out of reach',sub:''},
    '133':{text:'I will remind you',sub:'In 10 min'},
    '135':{label:'Messages',text:'No new messages yet'},
    '159':{text:'Reminder updated',sub:''},
    '160':{label:'Companion',text:'Our time together has ended',sub:''},
    '167':{label:'To-do reminders',text:'',sub:'No reminders waiting'},
    '168':{text:'Recording has expired'},
    '170':{text:'Chat is not available now'},
    '171':{text:'Recording saved'}
  };
  for(const [id,copy]of Object.entries(copyUpdates)){Object.assign(map[id].ui,copy);map[id].tag='情感文案优化';}
  map['17'].summary='来自 LUMIQ 每日内容服务的轻量分享，帮助孩子发现一点新鲜事。';
  map['17'].trigger='每日内容服务最多推送一次；用户主动打开后查看。';
  map['17'].feedback='页面只提示一次，点击“听听看”才播报；播报不会开启麦克风。';
  map['17'].edge='内容由服务端按日提供；无内容时不展示此页，不影响待机和其他功能。';
  map['77'].summary='通知与提醒中心；待机下滑或应用菜单进入。列表中的事项来自设备提醒和 App 同步。';
  map['77'].trigger='待机消息入口或应用菜单的“提醒”入口。';
  for(const id of ['68','167'])map[id].ui.items.forEach(item=>{item.sub='';});
  for(const id of ['60','61','62','63','64','65','66'])map[id].ui.actions.forEach(item=>{if(item.label==='Done')item.label='End';});
  for(const id of ['82','59'])map[id].ui.actions.forEach(item=>{
    if(['Not now','Later'].includes(item.label))item.label='No thanks';
    if(item.event==='CARE_START')item.label='Keep me company';
    if(item.event==='CARE_ACCEPT')item.label="Let's try";
  });
  map['58'].ui.actions.forEach(item=>{if(item.event==='CARE_END')item.label='End';});
  map['17'].ui.actions.forEach(item=>{if(item.label==='Play')item.label='Hear it';});
  map['108'].ui.items.forEach(item=>{if(item.label==='Steps')item.sub='';});
  map['83'].ui.items.forEach(item=>{if(item.event==='NAVIGATE')item.label='Wi-Fi switch';if(item.event==='WIFI_SCAN')item.label='Current network';});
  map['108'].title='菜单功能列表';
  map['108'].summary='菜单使用完整纵向列表，不再重复显示“更多”副标题；所有功能入口保留。';
  map['167'].summary='集中展示已到期且未完成的提醒，只显示事项，不重复显示到期状态；空列表显示暂无待办。';
  map['167'].feedback='按到期时间排序，点击打开对应提醒，可完成或延后；混合消息列表和提醒详情仍显示状态。';
  map['82'].title='开启陪伴确认';map['58'].title='正在陪伴';map['59'].title='休息邀请';map['160'].title='本次陪伴结束';
  map['82'].summary='设备邀请陪伴孩子，不是让孩子照顾宠物；显示麦克风将开启 30 分钟，先不用在左、开始陪伴在右。';
  map['82'].feedback='明确同意后开始收音；拒绝不收音。静音、录音冲突及 30 分钟上限沿用原有规则。';
  map['58'].summary='显示“我在陪着你”、剩余时间及实际麦克风收音状态；可随时结束。';
  map['59'].summary='用“一起歇一会儿吗？”发出可拒绝的邀请；不根据声音断言孩子的情绪。';
  map['59'].feedback='接受后停止收音并进入引导；先不用返回陪伴，不重复追问。';
  map['43'].summary='回答请求超时后明确本次未能回答，不再以“还在思考”暗示持续处理中；可重试或结束。';
  map['66'].summary='需要支持时建议找信任的大人聊聊，不承诺医疗、心理诊断或替代现实照护。';
  // Keep the original wheel semantics and one scrollable menu, not three menus.
  const menuItems=[
    {label:'Home',icon:'House',event:'NAVIGATE',target:'10'},
    {label:'Settings',icon:'Settings',event:'NAVIGATE',target:'180'},
    {label:'Voice note',icon:'Mic',event:'NAVIGATE',target:'70'},
    {label:'Companion',icon:'HeartHandshake',event:'NAVIGATE',target:'82'},
    {label:'Reminders',icon:'Bell',event:'NAVIGATE',target:'77'},
    {label:'AI chat',icon:'AudioLines',event:'AI_START',target:'161'},
    {label:'Friends',icon:'Users',event:'NAVIGATE',target:'185'},
    {label:'Care for companion',icon:'Smile',event:'NAVIGATE',target:'93'},
    {label:'Today\'s steps',icon:'Footprints',event:'NAVIGATE',target:'103'}
  ];
  map['74'].title='应用菜单';map['74'].ui.items=menuItems;
  map['74'].summary='沿用原始环形菜单：上方首页、中央对话，周围设置、录音、陪伴、提醒和好友；同页下方补充照顾伙伴与今日步数。';
  map['74'].trigger='待机菜单按钮或上滑进入；保留右滑入口但指向同一个菜单，不再出现另一套快捷页。';
  map['74'].feedback='菜单上下滚动不换页；主菜单的陪伴是设备陪伴孩子，照顾虚拟伙伴单独列出。已存录音在录音内，好友动态在好友内。';
  map['74'].edge='菜单不显示“更多”“继续设置”、已存录音或好友动态。返回保留滚动位置。P108、P116 合并至 P74，旧链接重定向到本菜单。';
  d.transitions['74']=[...menuItems.map(i=>route(i.label,i.event,i.target)),route('返回待机','BACK','10')];
  map['10'].summary='日常待机：点击角色直接对话，菜单和消息各有可见入口；上滑与右滑均进入同一个应用菜单。';
  map['109'].title='无线网络';map['109'].ui.label='Wi-Fi';
  map['109'].ui.actions=[{...action('Turn Wi-Fi off','WIFI_OFF_CONFIRM','114','secondary'),icon:'Power',iconOnly:true},rescan];
  map['109'].summary='合并原 P83 网络总览：直接选择网络，已连接网络置顶并标记，底部保留关闭网络和重新搜索。';
  map['109'].feedback='加密网络进入 P110，开放网络直接连接；换网成功回到此页并更新连接标记。网络开关需确认，返回不修改有效连接。';
  map['109'].edge='从设置总览的无线网络入口进入并记录来源；退出回到该来源。云端异常仍在 P78 处理，不将联网和云端可用混为一谈。';
  d.transitions['109']=[...d.transitions['109'].filter(r=>r.event!=='WIFI_SKIP'&&r.event!=='WIFI_CANCEL'),route('关闭无线网络','WIFI_OFF_CONFIRM','114'),route('返回设置来源','WIFI_CANCEL','180')];
  map['112'].feedback='首次继续选择伙伴；设置换网继续回 P109，显示新的已连接网络。';
  map['127'].feedback='重新搜索进入 P126；首次返回 P05 重新选择，设置来源回进入时的设置页。';
  map['128'].ui.actions.forEach(a=>{if(a.event==='WIFI_EDIT')a.label='Re-enter';});
  map['128'].summary='网络密码未通过认证，清空错误密码，点击重新输入在圆屏重试。';map['128'].feedback='重新输入回 P110；返回本次选网列表 P05 或 P109，不修改路由器密码。';
  d.transitions['128'].forEach(r=>{if(r.event==='WIFI_EDIT')r.label='重新输入';});
  map['174'].title='查看所选网络名称';map['174'].ui.label='Network name';map['174'].ui.sub='Selected network';
  map['174'].summary='从密码输入页点网络名称，核对完整 SSID；不是一个新的配网步骤。';map['174'].trigger='点击 P110 顶部的所选网络名称。';
  map['174'].feedback='标题明确为网络名称，完整显示所选 SSID；返回密码输入页保留当前输入并恢复密码遮蔽。';map['174'].edge='名称按原始字符换行，不翻译、不省略；SSID 上限由网络协议约束。预览使用长名称以展示此页用途。';
  map['13'].feedback='保持与其他回应页相同的角色展示尺寸，翻面进入静默，持续翻面后息屏。';
  map['70'].trigger='应用菜单的录音入口，或设备录音按键。';
  map['70'].summary='录音模块提供开始录音和已存录音两个入口，与智能对话分离。';
  map['70'].feedback='点击录音按钮或键 2 开始；点击已存录音查看 P124，返回应用菜单。';
  map['124'].title='已存录音';map['124'].summary='录音模块内的全部已保存录音，可查看、播放和删除；本地保存与云端备份状态分别显示。';
  map['124'].trigger='P70 录音中的已存录音入口，或录音结果中的查看记录。';
  map['124'].feedback='选择记录进入 P182 播放详情；列表为空时显示还没有录音并可开始录音。返回 P70 录音，再返回 P74 应用菜单。';
  map['124'].edge='不在应用主菜单重复设置入口；按 recordId 操作，删除仍需确认。无录音不伪造记录，未授权不上传。';
  map['124'].ui.actions=[{...action('Back','RECORD_LIST_BACK','70','secondary','back'),icon:'ArrowLeft',iconOnly:true}];
  d.transitions['124']=d.transitions['124'].map(r=>r.event==='BACK'?{...r,label:'返回录音',target:'70'}:r);
  d.transitions['124'].push(route('返回录音','RECORD_LIST_BACK','70'),route('选择已存录音','RECORD_OPEN','182','指定 recordId 存在','打开所选录音，不新建记录'));
  map['185'].trigger='P74 应用菜单的好友入口。';map['185'].feedback='碰一碰进入 P54；我的好友进入 P191；好友消息进入 P165。新消息显示未读标记，查看后清除；返回应用菜单。';
  map['165'].title='好友消息';map['165'].ui.label='Friend messages';map['165'].trigger='P185 好友菜单的好友消息入口、相关通知或等待页返回。';
  map['165'].feedback='展示好友邀请、回复和共同创作进度；查看列表标记当前消息已读，后续新回执重新显示未读。返回好友菜单 P185。';
  map['165'].ui.actions.forEach(a=>{if(a.event==='BACK')a.target='185';});
  d.transitions['165'].forEach(r=>{if(r.event==='BACK')r.target='185';});
  map['130'].trigger='历史页面保留为旧链接别名；当前版本不展示此页。';
  map['10'].edge='普通待机不收音。首次设置未完成时开机按进度直达下一步；日常待机不提供继续设置入口。';
  d.transitions['10']=d.transitions['10'].filter(r=>r.event!=='SETUP_RESUME');
  map['93'].trigger='应用菜单同页下方的照顾伙伴入口，或角色启用成功。';
  map['161'].trigger='待机角色、应用菜单的智能对话入口、陪伴中的主动对话或重试。';
  map['114'].trigger='P109 网络列表底部的关闭无线网络按钮。';
  map['115'].feedback='开启进入 P126 搜索；返回进入时的设置总览。关闭时不发起扫描、不显示虚假的连接。';
  d.transitions['115']=d.transitions['115'].filter(r=>r.event!=='WIFI_ON_SAVED');
  map['109'].trigger='设置中的无线网络入口，P126 返回扫描结果，或设置换网完成。';
  map['18'].title='角色等级提升';
  map['18'].summary='角色等级提升时显示成长反馈；预览使用等级 2，不以互动次数直接判定成长。';
  map['18'].trigger='收到当前角色的新等级，且等级高于已记录等级；忙碌时延后到待机或伙伴总览展示。';
  map['18'].feedback='显示新的等级，确认后回到触发前的待机或伙伴总览。';
  map['18'].edge='重复、降低或无效等级不触发；不自行设定经验值门槛，不默认解锁动作。';
  map['18'].ui.actions=[action('Done','BACK','10','primary')];
  d.transitions['18']=[route('完成并返回来源','BACK','10','返回进入时的待机或伙伴总览')];
  map['103'].ui.sub='From this device';
  map['103'].trigger='从应用菜单点击“今日步数”进入。';
  map['103'].summary='显示来自 LG01 内置运动传感器的今日步数；当前原型使用演示数值。';
  map['103'].edge='步数来源是 LG01 本机计步传感器，按本地日期累计；当前 4,820 步仅用于演示，不代表真实传感器读数。';
  map['11'].title='夜间回应';
  map['11'].summary='夜间自动降低打扰的回应状态，不需要手动开启安静时段。';
  map['11'].trigger='夜间时段收到轻敲或翻转输入时自动触发。';
  // Retired resource-download screens remain resolvable for old links, but are
  // no longer part of the current review flow. Preset selection is local.
  map['78'].ui.actions=map['78'].ui.actions.filter(a=>a.event==='NETWORK_RETRY');
  d.transitions['78']=d.transitions['78'].filter(r=>r.event==='NETWORK_RETRY');
  map['78'].feedback='只保留再试一次：重新检测服务，成功后按首次设置或日常来源继续；失败仍回到本页。';
  map['78'].edge='不提供继续或跳过，不重复输入已连接网络的正确密码。';
  add('187','日常菜单','list',{label:'Daily',items:[{label:'Reminders',icon:'Bell',event:'NAVIGATE',target:'77'},{label:'Today\'s steps',icon:'Footprints',event:'NAVIGATE',target:'103'}]},'应用菜单的日常入口集中承载提醒与今日步数，不增加主菜单图标。','沿用两行列表；步数属于本机运动数据，不与伙伴等级绑定。');
  map['187'].trigger='点击 P74 环形菜单中的“日常”。';map['187'].feedback='进入提醒或今日步数；返回环形菜单。';
  d.transitions['187']=[...map['187'].ui.items.map(item=>route(item.label,item.event,item.target)),route('返回菜单','BACK','74')];
  map['74'].summary='保留原始环形布局与中央对话入口；提醒入口调整为日常，内部提供提醒与今日步数。';
  map['74'].ui.items=[{label:'My companion',icon:'Smile',event:'NAVIGATE',target:'93'},...map['74'].ui.items.filter(item=>!['10','93','103'].includes(item.target))];
  map['74'].ui.items=map['74'].ui.items.map(item=>item.target==='77'?{...item,label:'Daily',icon:'CalendarDays',target:'187'}:item);
  d.transitions['74']=[...map['74'].ui.items.map(item=>route(item.label,item.event,item.target)),route('右滑返回待机','BACK','10')];
  map['74'].feedback='顶部只显示我的伙伴，点击进入伙伴页查看等级；中间为对话，其余为设置、录音、陪伴、日常和好友。日常内可查看提醒与步数；右滑返回待机。';
  map['74'].edge='主菜单不显示等级，没有独立步数、首页或更多入口；伙伴页等级沿用当前角色状态。';
  map['93'].title='我的伙伴与等级';map['93'].trigger='P74 菜单首屏的我的伙伴入口，或 P186 完成或取消伙伴切换。';
  map['93'].ui.items.push({label:'Manage companions',icon:'LayoutGrid',event:'PET_SWITCH_OPEN',target:'186'});
  d.transitions['93'].push(route('左滑伙伴区：下一个','PET_COMPANION_NEXT','93','当前伙伴页有效且有下一个本地伙伴','切换当前伙伴，保留各自等级、照顾状态和共享库存'),route('右滑伙伴区：上一个','PET_COMPANION_PREV','93','当前伙伴页有效且有上一个本地伙伴','不返回上级；其他区域右滑及返回按钮仍返回进入来源'),route('管理伙伴','PET_SWITCH_OPEN','186','当前伙伴页有效','查看本地伙伴和待启用照片任务，选择后仍需确认'));
  map['93'].summary='当前伙伴的等级和照顾状态集中展示；在上方伙伴展示区左右滑动切换，或点击左右箭头。下方照顾列表仍上下滚动，末尾保留管理伙伴入口。';
  map['93'].feedback='左滑显示下一个、右滑显示上一个；即时切换并留在 P93，显示当前位置。等级、饱足、清洁、能量及冷却按 avatarId 独立保存，切回恢复原值。';
  map['93'].edge='首尾不循环，只有一个伙伴时不可滑动切换。仅本地可用伙伴参与切换；滑动不触发喂养，不重置库存、冷却或返回来源。横向滑动只在伙伴展示区生效，不抢占照顾列表上下滚动或其他区域右滑返回。';
  d.transitions['94']=(d.transitions['94']||[]).concat(route('从应用同步已购买食物','FOOD_SYNC_REQUEST','94','设备已进入喂养页且 App 可用','发起购买库存同步，不在设备端购买'));
  d.transitions['157']=(d.transitions['157']||[]).concat(route('同步应用购买记录','FOOD_SYNC_REQUEST','157','喂养因库存不足被阻断','从 App 获取已购买库存；同步失败留在此页'),route('App 已购食物同步成功','FOOD_INVENTORY_SYNC','94','本设备且版本有效；食物可用且伙伴允许喂养','更新库存后进入确认，不自动扣粮；其他状态仍回当前页面'),route('库存同步失败或超时','FOOD_SYNC_FAILED','157','requestId 与当前同步请求一致','保留此前确认的库存和已消耗数，可重试'));
  map['94'].title='食物库存与喂养确认';map['94'].summary='喂养前检查 App 已购买并同步到设备的食物库存；每次有效喂养消耗 1 份，不能无限喂养。';
  map['94'].feedback='显示剩余食物，点击喂养 1 份才提交：扣除 1 份并增加当前伙伴饱腹度，返回 P93；取消不扣粮。';
  map['94'].edge='库存为 0 时不能喂养，需在 App 购买后同步；库存、冷却、饱腹、休息和重复点击均由设备校验。';
  map['157'].edge='库存不足显示“请在应用中购买食物”并提供同步入口；同步失败可重试，设备不提供购买按钮，不消耗库存。';
  map['157'].title='食物不足与照顾限制';map['157'].summary='按当前伙伴状态区分已吃饱、冷却、休息和食物库存不足；购买与支付只在 App 内完成。';
  map['157'].feedback='无库存可从 App 同步已购买食物；有可用食物并满足喂养条件后回 P94 确认，等待和失败均可返回伙伴页。';
  map['103'].trigger='P74 菜单 → P187 日常 → 今日步数。';
  map['103'].feedback='显示今日步数；返回 P187 日常菜单。';
  map['107'].feedback='再试一次重新读取步数；返回 P187 日常菜单，不显示虚假零步。';
  for(const id of ['103','107']){
    for(const item of [...map[id].ui.actions,...d.transitions[id]])if(item.event==='BACK')item.target='187';
  }
  map['77'].trigger='P187 日常中的提醒入口，或待机消息快捷入口。';
  map['77'].summary='通知与提醒中心；从日常菜单或待机消息入口进入，返回保留实际来源。';
  map['10'].summary='日常待机保留角色、时钟、菜单与消息快捷入口；不放置步数入口。';
  d.transitions['10']=d.transitions['10'].filter(r=>r.target!=='103');
  map['05'].edge='超时返回本列表，显示内联提示；重新点击网络输入密码或连接，不新增失败页面。';
  d.transitions['10']=d.transitions['10'].filter(r=>r.target!=='166');
  map['180'].ui.items.find(item=>item.target==='75').label='General settings';
  d.transitions['180'].find(r=>r.target==='75').label='General settings';
  map['180'].summary='通用设置承载音量、亮度、安静模式、显示和隐私；无线网络、语言、角色、回忆和关于保留独立入口。';
  map['75'].title='通用设置';map['75'].ui.label='General settings';
  map['75'].ui.items=map['75'].ui.items.filter(item=>!['OPEN_MIC','OPEN_WIFI'].includes(item.event)).flatMap(item=>item.event==='OPEN_ADJUST'?[
    {label:'Volume',sub:'40%',icon:'Volume2',event:'OPEN_VOLUME',target:'31'},
    {label:'Brightness',sub:'55%',icon:'Sun',event:'OPEN_BRIGHTNESS',target:'32'}
  ]:[item]);
  d.transitions['75']=[...map['75'].ui.items.map(item=>route(item.label,item.event,item.target)),route('返回进入来源','BACK','180','返回进入时的设置总览或待机','保留各项设置')];
  map['75'].trigger='P180 设置总览中的通用设置，或待机左滑、设备调节按键。';
  map['75'].feedback='音量和亮度分别进入单项调节页；安静模式使用开关语义。无线网络只在设置总览提供入口，不提供独立麦克风开关。';
  for(const [id,setting,title,label]of [['31','volume','音量调整','Volume'],['32','brightness','亮度调整','Brightness']]){
    map[id].title=title;map[id].type='single-slider';
    map[id].ui={kind:'single-slider',setting,label,text:'',sub:'',tone:'dark',items:[],actions:[action('Back','BACK','75','secondary','back')]};
    map[id].summary='独立调节'+(setting==='volume'?'音量':'亮度')+'，只显示当前通道的图标、滑条和数值。';
    map[id].trigger='从 P75 通用设置中的对应入口进入。';
    map[id].feedback='调节即时生效并保留，返回通用设置后显示最新数值，不需要完成或保存按钮。';
    map[id].edge=setting==='volume'?'音量范围 0% 至 100%；0% 为静音输出，不改变麦克风或亮度。':'亮度范围 10% 至 100%，避免误调成黑屏；不改变音量。';
    d.transitions[id]=[route('返回通用设置','BACK','75','返回进入来源；独立打开时返回通用设置','保留已调节数值')];
  }
  map['82'].title='陪伴开关（关闭）';map['82'].type='choices';
  map['82'].ui={kind:'choices',label:'Companion',text:'Here when you need me',sub:'Listens to your voice when on',tone:'dark',items:[],actions:[action('Turn on','CARE_START','58'),action('Back','BACK','74','secondary','back')]};
  map['82'].summary='陪伴默认关闭，用户通过开关主动开启；不再使用确认弹层或 30 分钟限时会话。';
  map['82'].trigger='应用菜单点击陪伴；关闭状态可直接开启。';
  map['82'].feedback='开启后进入 P58；关闭立即停止监听并使旧声音回执失效。';
  map['82'].edge='只有主动开启才监听；硬件静音、重启或安全中断关闭开关，不在解锁后自行开启。原型无真实采集。';
  map['58'].title='陪伴开关（开启）';map['58'].ui.text='I am here with you';map['58'].ui.sub='';map['58'].ui.actions=[action('Turn off','CARE_END','82','secondary')];
  map['58'].summary='开关持续保持开启；在待机、菜单与陪伴页监听声音及主动表达，不根据声学信号断言情绪或原因。';
  map['58'].trigger='P82 主动开启，或从菜单返回已开启的陪伴。';
  map['58'].feedback='有效声音线索触发简短安抚，反馈后继续陪伴；不显示倒计时。';
  map['58'].edge='录音、对话、播放反馈、其他功能和息屏期间暂停收音；回到可监听的待机或菜单时恢复。切换暂停后重新生成会话标识，旧回执不生效；同类触发至少间隔 30 秒。';
  d.transitions['82']=[route('开启陪伴','CARE_START','58','用户主动打开开关且麦克风可用','开启持续陪伴'),route('麦克风被锁定','CARE_BLOCKED','27'),route('返回菜单','BACK','74')];
  d.transitions['58']=[route('模拟需要安抚的声音线索','CARE_SOUND','59','当前监听会话有效且冷却结束','给出中性安抚，不推断身份或事件原因'),route('关闭陪伴','CARE_END','82'),route('返回菜单，继续陪伴','BACK','74'),route('录音暂时占用麦克风','REC_START','71'),route('主动对话暂时占用麦克风','AI_START','161')];
  map['59'].title='声音触发的轻声安抚';map['59'].ui.text='I am here. Take your time';map['59'].ui.sub='';
  map['59'].ui.actions=[action('Quiet for now','CARE_QUIET','58','secondary'),action('Breathe together','CARE_ACCEPT','60')];
  map['59'].summary='收到有效声音线索后，主动给出简短安抚；可继续呼吸引导或暂时安静。';
  map['59'].trigger='已开启陪伴且监听会话匹配的声音事件；原型通过审阅分支模拟。';
  map['59'].feedback='安抚期间暂停收音，6 秒后回到触发前页面并继续陪伴；点击一起呼吸进入引导。';
  d.transitions['59']=d.transitions['59'].filter(r=>r.event!=='CARE_END');
  for(const id of ['59','60','61','62','63','64','65','66']){
    map[id].edge='陪伴开关保持开启，但反馈播放期间暂停监听，避免重复拾取自身声音。情绪情境只使用用户主动表达或明确选择，不做诊断，不保存或上传环境录音。关闭后迟到事件不生效。';
    if(id!=='59'){
      map[id].feedback='本次安抚播放 12 秒后自动回到原页面并继续陪伴；不显示完成按钮。返回可提前结束本次反馈，硬件静音或关闭开关会停止。';
      map[id].ui.actions=map[id].ui.actions.filter(a=>!['CARE_END','CARE_CONTINUE','BACK'].includes(a.event)&&!['Done','End'].includes(a.label));
      map[id].ui.actions.push({...action('Back','BACK','58','secondary','back'),icon:'ArrowLeft',iconOnly:true});
      d.transitions[id]=d.transitions[id].filter(r=>!['CARE_END','CARE_CONTINUE','BACK'].includes(r.event)).map(r=>r.event==='CARE_SLEEP_COMPLETE'?route('睡前安抚播放完成','CARE_SLEEP_COMPLETE','58','当前反馈标识有效','自动结束本次反馈并返回触发来源'):r);
      d.transitions[id].push(route('返回，结束本次反馈','BACK','58','返回触发反馈前的页面；独立审阅时返回陪伴页','保留陪伴开关，结束当前播放'));
    }
    d.transitions[id].push(route('本次反馈播放完成','CARE_FEEDBACK_DONE','58','当前反馈标识有效','返回触发前页面并恢复陪伴'),route('关闭陪伴','CARE_END','82'));
  }
  // Hardware mute is a local guard, not a separate destination screen.
  for(const [id,routes]of Object.entries(d.transitions))if(id!=='27'){
    for(const r of routes)if(r.target==='27')Object.assign(r,{target:['14','161'].includes(id)?'10':id,label:'硬件已静音',guard:['14','161'].includes(id)?'硬件静音有效；返回实际 aiOrigin，独立审阅时返回待机':'硬件静音有效；原任务不得开始或继续采集',effect:['14','161'].includes(id)?'结束对话采集并返回对话入口，内联提示；解除静音不自动重开任务':'留在当前页面内联提示，立即停止收音；解除静音不自动重开任务'});
  }
  for(const page of Object.values(map))if(page.n!=='27')for(const item of [...page.ui.actions,...page.ui.items])if(item.target==='27'){item.target=page.n;item.label='硬件已静音';}
  map['185'].ui.items.unshift({label:'Tap to make friends',icon:'ContactRound',event:'PEER_DISCOVERY_OPEN',target:'54'});
  map['185'].summary='好友菜单固定为碰一碰交友、我的好友、好友消息三个入口；不混排具体好友。添加宠物与共同生成新角色仍为两条独立流程。';
  d.transitions['185'].unshift(route('碰一碰交友','PEER_DISCOVERY_OPEN','54'));
  map['54'].title='碰一碰交友';map['54'].ui={kind:'status',label:'Friends',text:'Tap to make friends',sub:'Bring the two devices together',items:[],actions:[action('Back','BACK','185','secondary','back')]};
  map['54'].trigger='P185 好友菜单中的碰一碰交友入口。';
  map['54'].summary='等待两台设备碰一碰的发现事件；识别对方后进入好友确认，不把接触本身当作同意。';
  map['54'].edge='演示侧栏仅模拟发现事件；生产环境需设备协议提供设备与宠物标识。无效、自身或迟到发现不建立关系；返回可退出等待。';
  d.transitions['54']=[route('识别对方设备','PEER_TAP','55','有效的新设备发现回执','保存对方设备及已有宠物的快照，不自动添加好友'),route('退出发现','BACK','185')];
  map['55'].title='确认碰一碰好友';map['55'].ui.actions=[action('Not now','BACK','185','secondary'),action('Be friends','FRIEND_REQUEST','176')];
  map['55'].summary='显示本次碰一碰识别出的对方与宠物，用户确认后等待对方同意。';
  map['55'].edge='请求锁定 encounterId、peerId 和宠物快照；未经本机确认不发送，未经双方同意不建立好友关系。';
  d.transitions['55']=[route('确认交友','FRIEND_REQUEST','176','当前有效发现且社交权限允许','创建绑定当前对方的确认请求'),route('暂不交友','BACK','185')];
  map['176'].feedback='显示当前对方，等待其确认；取消或超时结束本次邀请，旧请求回执失效。';
  d.transitions['176'].push(route('对方拒绝交友','FRIEND_REMOTE_DECLINE','144','当前 requestId、revision 和对方身份匹配','记录拒绝，不建立好友，也不添加宠物'));
  map['144'].title='邀请结束';map['144'].summary='交友、组队和共同创作邀请共用结束页，分别显示拒绝、取消或超时原因。';
  map['142'].feedback='来邀已包含对方同意；本机接受后双方同意齐全，直接进入 P91 生成；拒绝或过期进入 P144。';
  map['142'].ui.actions=map['142'].ui.actions.map(item=>item.event==='AVATAR_ACCEPT'?{...item,target:'91'}:item);
  d.transitions['142']=d.transitions['142'].map(item=>item.event==='AVATAR_ACCEPT'?{...item,target:'91',guard:'有效来邀，双方同意且好友关系有效',effect:'本机接受后开始生成，无需对方重复确认'}:item);
  map['56'].title='好友与对方伙伴';map['56'].summary='查看已确认的好友，可问候、组队或添加对方已有宠物。添加不替换正在使用的伙伴。';
  map['56'].trigger='P191 我的好友中选择好友，或碰一碰双方确认成功、好友消息中的已完成交友请求。';map['56'].feedback='返回真实来源：好友列表 P191、碰一碰入口或好友消息 P165；保留选中好友及列表位置。';
  map['56'].ui.actions.push(action('Add companion','PEER_IMPORT_OPEN','188'),action('More interactions','NAVIGATE','87'));
  d.transitions['56'].push(route('更多好友互动','NAVIGATE','87'));
  map['87'].title='好友互动';map['87'].type='list';
  map['87'].ui={kind:'list',label:'Friends',text:'',sub:'',items:[{label:'Team up',icon:'Users',event:'NAVIGATE',target:'88'},{label:'Create together',icon:'Sparkles',event:'NAVIGATE',target:'141'}],actions:[action('Back','BACK','56','secondary','back')]};
  map['87'].summary='已确认好友的组队与共同创作入口，不再在碰一碰时选择关系类型。';
  map['87'].trigger='P56 好友详情中的更多互动。';map['87'].feedback='选择组队或共同创作；取消返回同一位好友详情。';
  map['87'].edge='保留当前好友标识；所有邀请仍需双方确认，宠物添加独立放在好友详情。';
  d.transitions['87']=[route('组队','NAVIGATE','88'),route('共同创作','NAVIGATE','141'),route('返回好友详情','BACK','56')];
  d.transitions['56'].push(route('添加对方已有宠物','PEER_IMPORT_OPEN','188','当前好友关系有效','确认前不下载、不添加、不切换'),route('查看已添加的伙伴','PEER_COMPANIONS_OPEN','186','该好友宠物已添加','打开伙伴选择页，仍须手动确认才切换'));
  add('188','确认添加对方宠物','choices',{label:'Add companion',text:'Add this companion?',actions:[action('Cancel','PEER_IMPORT_CANCEL','56','secondary'),action('Add','PEER_IMPORT_CONFIRM','189')]},'从好友详情确认添加对方已有宠物，与共同生成角色分开。','必须是已确认好友；取消不增加伙伴。重复添加复用同一设备和宠物标识。');
  add('189','正在添加对方宠物','status',{label:'Add companion',text:'Adding companion',actions:[action('Cancel','PEER_IMPORT_CANCEL','56','secondary')]},'添加已确认好友的宠物资源，成功后回好友详情。','回执必须匹配 attemptId；失败、超时、取消和授权撤销不添加伙伴，不替换当前角色。');
  add('190','对方宠物添加失败','status',{label:'Add companion',text:'Could not add companion',actions:[action('Cancel','PEER_IMPORT_CANCEL','56','secondary'),action('Try again','PEER_IMPORT_RETRY','189')]},'失败状态与好友模块集中放置，可重新添加或退出。','重试重新校验权限、关系和目标宠物，并创建新尝试；旧回执不能完成新任务。');
  d.transitions['188']=[route('确认添加','PEER_IMPORT_CONFIRM','189','当前好友关系、宠物与权限均有效','启动独立添加任务'),route('取消添加','PEER_IMPORT_CANCEL','56')];
  d.transitions['189']=[route('添加成功','PEER_IMPORT_SUCCESS','56','attemptId 匹配且任务有效','仅加入本地伙伴列表，不自动切换'),route('添加失败或超时','PEER_IMPORT_FAILED','190','attemptId 匹配','保留好友，允许重试'),route('取消添加','PEER_IMPORT_CANCEL','56')];
  d.transitions['190']=[route('重新添加','PEER_IMPORT_RETRY','189','重新检查好友关系及权限','创建新尝试'),route('取消添加','PEER_IMPORT_CANCEL','56')];
  d.transitions['186'].push(route('取消查看好友伙伴','COMPANION_CANCEL','56','来自好友详情','保留当前伙伴'),route('使用已添加伙伴','COMPANION_COMMIT','93','来自好友详情，所选伙伴本地可用','明确确认后切换并查看伙伴状态'));
  map['93'].summary='展示当前伙伴的独立等级和照顾状态；可切换预置伙伴、已启用生成伙伴及已确认添加的好友宠物。';
  map['186'].summary='选择本地可用伙伴，包含预置、已启用生成伙伴与已添加好友宠物；选择后确认才切换。';
  d.transitions['01'].push(route('自检后按设置进度继续','BOOT','178','本次启动有效；按已完成设置进入实际下一步','首次选择语言，已设置回到待机'));
  d.transitions['123'].push(route('本地保存后提示备份状态','REC_LOCAL_ONLY','171','当前记录已本地保存且尚未云端备份'));
  d.transitions['81'].push(route('提醒提示结束，继续录音','REC_NOTICE_DISMISS','71','当前录音仍有效','保留排队提醒'));
  d.transitions['72'].push(route('录音结果自动返回','REC_RESULT_DONE','74','返回实际 recOrigin；菜单来源回 P74，待机来源回 P10'));
  d.transitions['137'].push(route('问候送达','SOCIAL_SENT','138','当前发送有效、社交权限及好友关系均有效'));
  d.transitions['76'].push(route('结束后自动返回','AI_RETURN','10','返回实际 aiOrigin；从菜单进入则回 P74'));
  d.transitions['42'].push(route('录音处理后自动返回','REC_RESULT_DONE','10','返回实际 recOrigin；菜单来源回 P74，待机来源回 P10'));
  d.transitions['22'].push(route('服务检测完成','NETWORK_RESULT','10','检测回执有效；按网络、云端及首次设置进度进入实际结果页'));
  for(const id of ['51','52','53']){
    map[id].ui.actions=map[id].ui.actions.filter(a=>a.event!=='BACK');
    map[id].ui.actions.unshift(action('Later','PHOTO_LATER','10','secondary','defer'));
    map[id].edge='App 照片任务按 requestId 和 attemptId 区分；稍后保留任务，可从我的伙伴中的伙伴选择或消息列表继续查看。后台结果不抢占当前操作，不自动启用。';
  }
  d.transitions['51']=[route('App 提交照片','REVIVE_START','52','当前照片任务及尝试编号匹配'),route('稍后处理','PHOTO_LATER','10','返回真实来源，任务保留')];
  d.transitions['52']=[route('照片生成成功','REVIVE_SUCCESS','53','本任务及尝试匹配，结果标识和名称有效'),route('生成失败或等待超时','REVIVE_FAILED','102','保留原任务以便查询'),route('稍后处理','PHOTO_LATER','10','返回真实来源，后台继续')];
  d.transitions['53']=[route('启用照片角色','OPEN_ACTIVATE','154','使用当前照片任务结果，不使用默认角色'),route('稍后启用','PHOTO_LATER','10','保留结果，不回到生成中')];
  d.transitions['102'].push(route('查询照片生成任务','REVIVE_RETRY','52','照片任务失败时可用','查询原任务，更新尝试编号，不新建付费生成'),route('稍后查看照片角色','PHOTO_LATER','93','照片任务上下文','返回实际来源'));
  map['186'].feedback+=' 已有照片任务独立显示进度或结果，点击查看后明确启用；未启用结果不冒充本地可用伙伴。';
  map['77'].edge+=' App 新建、更新、删除按 noteId 与 revision 同步；离线操作保留待同步记录，失败可在列表重试。';
  for(const id of ['146','147','148'])map[id].edge+=' 回执必须匹配本次 sessionId；取消、重试或安全中断后旧回执失效，120 秒未完成可重试。';
  map['23'].title='入座充电提示';map['23'].ui={kind:'status',label:'Charging',text:'Charging started',sub:'',items:[],actions:[],tone:'dark'};
  map['23'].summary='稳定入座后显示独立的充电确认，1.5 秒后进入充电中；不显示角色、时钟或待机快捷栏。';
  map['23'].trigger='已完成设置、屏幕亮起且空闲待机时收到稳定入座事件。';
  map['23'].feedback='自动进入 P24；当前电量已被确认充满则进入 P26。无需继续按钮，可直接使用设备按键。';
  map['23'].edge='重复入座不重复提示；录音、对话、设置、息屏和系统任务中仅更新充电状态，不抢占页面或清空输入。接触异常单独处理。';
  d.transitions['23']=[route('入座反馈结束（1.5 秒）','DOCK_FEEDBACK_DONE','24','入座会话匹配且反馈时间已到','进入当前充电状态页'),route('打开菜单','OPEN_MENU','74'),route('拔出底座','DOCK_REMOVED','10'),route('接触不稳定','DOCK_CONTACT_ERROR','45')];
  for(const [id,title]of [['24','充电中'],['26','已充满']]){
    map[id].title=title;map[id].type=map['23'].type;
    map[id].ui={kind:'status',label:id==='26'?'Fully charged':'Charging',text:id==='26'?'Fully charged':'Charging',sub:'',actions:[action('Menu','OPEN_MENU','74')],items:[],tone:'dark'};
    map[id].summary='独立充电状态页，突出电池图标、真实回执电量和充电状态；不复用角色、时钟或待机快捷栏。';
    map[id].trigger=id==='24'?'入座提示结束，或充电期间从其他功能返回空闲页。':'本次充电会话收到有效的满电回执，电量为 100%。';
    map[id].feedback='上滑或点击底部箭头进入菜单；功能结束后按当前电池状态返回充电页。充满不表示内容同步完成。';
    map[id].edge='保持原有自动息屏和唤醒设置；低功耗显示也只显示静态电量与充电状态，不显示待机时钟。电量回执不重置空闲计时，不打断当前任务；拔出恢复普通待机，过热保护优先。';
    d.transitions[id]=[...d.transitions['10'].map(r=>({...r})),
      {...route(id==='24'?'电量已充满':'恢复充电','CHARGE_UPDATED',id==='24'?'26':'24','本次 sessionId、更高 revision 和有效电量','只更新电池状态'),battery:id==='24'?100:99,status:id==='24'?'full':'charging'},
      route('拔出底座','DOCK_REMOVED','10'),route('已有授权的内容开始同步','DOCK_SYNC_START','25','底座有效、空闲且已有同步授权','模拟内容差异事件；入座本身不授予同步权限'),route('接触不稳定','DOCK_CONTACT_ERROR','45'),route('温度过高','THERMAL_LIMIT','48')];
  }
  map['25'].ui.actions=[action('Later','BACK','24','secondary','defer')];
  map['25'].feedback='内容同步完成后回到实际充电状态页；不改写电量，不把完成同步当成电池充满。稍后返回空闲页，保留本次同步任务。';
  map['25'].edge='回执必须匹配当前底座会话与同步 attemptId。移除底座暂停同步，失败可重试，旧内容保留；后台结果不跳离其他操作。';
  d.transitions['25']=[route('内容同步完成','DOCK_SYNC_DONE','24'),route('同步失败','DOCK_SYNC_FAILED','47'),route('拔出底座，同步暂停','DOCK_REMOVED','46'),route('稍后查看','BACK','24')];
  map['26'].ui.label='Fully charged';
  map['79'].edge+=' 底座连接期间低功耗显示切换为静态电量与充电状态，不出现待机时钟；拔出后恢复普通时钟。';
  map['45'].ui.actions=[action('Back','BACK','10','secondary','back')];
  map['45'].feedback='重新放稳底座后自动重新确认入座；返回可继续使用设备。异常期间不显示正在充电，使用中发生异常先保留当前操作。';
  d.transitions['45']=[route('重新放稳底座','DOCK_CONNECTED','23'),route('暂不处理','BACK','10')];
  for(const id of ['46','47']){
    map[id].ui.actions=[action('Later','BACK','24','secondary','defer'),action(id==='46'?'Resume':'Try again','DOCK_SYNC_START','25')];
    map[id].feedback='底座连接稳定后可重新发起同步；每次重试使用新 attemptId。稍后回当前待机，原内容不变。';
    map[id].edge='未重新入座时不可恢复同步；取消后的迟到结果不生效。同步完成不代表充电完成。';
    d.transitions[id]=[route('重新放入底座','DOCK_CONNECTED',id,'稳定入座，只更新充电状态，不中断恢复页'),route('恢复内容同步','DOCK_SYNC_START','25','底座连接有效'),route('稍后处理','BACK','24')];
  }
  d.transitions['10'].push(route('放入底座','DOCK_CONNECTED','23','设备空闲且供电稳定','1.5 秒入座反馈后显示充电状态页'));
  for(const id of ['33','34'])d.transitions[id]=d.transitions[id].map(r=>['CHARGING_STARTED','POWER_CONNECTED'].includes(r.event)?route('接入底座供电','DOCK_CONNECTED',id,'供电稳定','更新充电状态，不自动解除低电量保护'):r);
  d.transitions['34'].push(route('电池安全条件恢复','SAFETY_CLEAR','24','安全模块确认恢复且底座仍连接','有录音草稿或系统恢复任务时优先返回对应恢复页'));
  const aliases={'27':'75','38':'37','83':'109','108':'74','113':'109','116':'74','117':'75','119':'120','160':'82','166':'10','179':'02','130':'05','131':'186','132':'186'};
  d.pageAliases=aliases;
  for(const id of Object.keys(aliases)){if(id!=='119')delete map[id];delete d.transitions[id];}
  for(const page of Object.values(map))for(const item of [...page.ui.actions,...page.ui.items])if(aliases[item.target])item.target=aliases[item.target];
  for(const [id,routes]of Object.entries(d.transitions)){
    for(const r of routes){
      if(aliases[r.target])r.target=aliases[r.target];
      if(r.event==='OPEN_WIFI')r.target='126';
      if(r.event==='WIFI_CANCEL'&&id!=='05')r.target='180';
      if(r.event==='OPEN_QUICK_APPS')r.label='右滑（同一菜单）';
    }
  }
  for(const page of Object.values(map))for(const item of [...page.ui.actions,...page.ui.items])if(item.event==='OPEN_WIFI')item.target='126';
  for(const id of ['02','05','10','11','12','13','74','109','112','127','128','174'])map[id].tag='菜单与配网精简';
  for(const id of ['10','70','74','124','165','185'])map[id].tag='菜单归类修订';
  const hiddenReviewIds=new Set(['119','120']);
  d.runtimePages=Object.fromEntries([...hiddenReviewIds].filter(n=>map[n]).map(n=>[n,map[n]]));
  const groups=[
    ['setup','开机与主设备连接',['01','178','02','03','04','05','110','111','112','186','07','09','37']],
    ['wifi','网络设置与异常恢复',['126','109','127','128','129','174','114','115']],
    ['daily','日常与菜单',['10','11','12','13','74','17','18','79']],
    ['chat','AI 对话',['161','14','15','16','76','41','43','44','21','78','170','162']],
    ['voice','录音与回放',['70','71','184','81','121','122','123','124','182','183','72','171','73','125','177','42','158','168','164']],
    ['reminders','日常：提醒与步数',['187','77','67','68','69','133','134','159','167','135','103','107']],
    ['pet','宠物照顾',['93','94','95','96','175','97','98','99','157']],
    ['care','陪伴开关与安抚反馈',['82','58','59','60','61','62','63','64','65','66']],
    ['friends','好友与伙伴添加',['185','191','54','87','55','176','56','188','189','190','136','137','138','139','57','88','89','90','141','142','143','145','144','91','92','102','165','140','169','51','52','53','154','155','156']],
    ['settings','设置与隐私',['180','75','31','32','30','28','172','173','181']],
    ['memories','记忆同步',['29','146','147','148','08','39','40','149']],
    ['system','底座、系统与恢复',['22','23','24','25','26','45','46','47','33','34','48','118','163','35','49','50','100','101','150','151','152','153']]
  ];
  const assigned=new Set();
  d.groups=groups.map(([id,title,ids])=>({id,title,pages:ids.map(n=>{if(!map[n]||assigned.has(n))throw Error('Page mapping '+n);assigned.add(n);return map[n];})}));
  const remaining=Object.values(map).filter(p=>!assigned.has(p.n)&&!hiddenReviewIds.has(p.n));
  if(remaining.length)d.groups.push({id:'other',title:'补充状态',pages:remaining});
  d.counts.pages=Object.keys(map).length-hiddenReviewIds.size;
  d.counts.transitions=Object.values(d.transitions).reduce((sum,r)=>sum+r.length,0);
  global.FoxPages=Object.fromEntries(Object.entries(map).filter(([id])=>!hiddenReviewIds.has(id)));
})(typeof window!=='undefined'?window:globalThis);
