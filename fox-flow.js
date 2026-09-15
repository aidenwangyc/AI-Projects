(function(global){
  'use strict';
  const data=global.LG01_DATA,pages=global.FoxPages;
  const stage=(id,title,kind,ids,links=[])=>({id,title,kind,ids,links:links.map(([n,label])=>({n,label}))});
  const kinds={path:{label:'主流程',icon:'ArrowRight'},branch:{label:'可选分支',icon:'GitBranch'},states:{label:'相关状态',icon:'Layers'},recovery:{label:'异常恢复',icon:'RotateCcw'}};
  // Review order is shared by the gallery, page index and catalog navigation.
  // It does not change device events, guards, permissions or destinations.
  const plan=[
    {id:'setup',title:'首次使用',sections:[
      stage('start','开机与连接主设备','path',['01','178','02','03','04'],[['05','连接成功后选网']]),
      stage('recovery','连接请求超时','recovery',['37'],[['02','重新发起连接'],['04','再试一下']]),
      stage('network','在圆屏连接加密网络','path',['05','110','111','112'],[['111','开放网络直接连接'],['186','联网后选择伙伴']]),
      stage('companion','选择伙伴与首次问候','path',['186','07','09'],[['10','进入日常待机']])
    ]},
    {id:'daily',title:'日常待机与功能入口',sections:[
      stage('menu','待机与环形应用菜单','path',['10','74'],[['161','智能对话'],['82','陪伴孩子'],['70','录音与已存录音'],['187','日常：提醒与步数'],['185','好友与消息'],['180','设备设置'],['93','我的伙伴与等级']]),
      stage('moments','每日分享与播报','states',['17','162'],[['17','播报结束返回分享'],['10','回到待机']]),
      stage('responses','轻敲、翻转与夜间回应','states',['12','13','11']),
      stage('display','时钟息屏','states',['79'],[['10','唤醒回到待机']])
    ]},
    {id:'chat',title:'智能对话',sections:[
      stage('conversation','进入、聆听、回答与结束','path',['161','14','15','16','76'],[['14','回答结束继续聆听'],['74','结束后返回菜单']]),
      stage('recovery','未听清、超时与安全回应','recovery',['41','43','44','170'],[['161','重新进入对话'],['21','离线状态'],['78','服务不可用']])
    ]},
    {id:'pet',title:'我的伙伴与照顾',sections:[
      stage('actions','伙伴切换与状态总览','states',['93'],[['186','切换本地可用伙伴'],['94','使用 App 购买的食物喂养'],['95','清洁伙伴']]),
      stage('feeding','App 购买库存与喂养确认','path',['94'],[['93','喂养或取消后返回伙伴'],['157','库存不足时在 App 购买后同步']]),
      stage('feeding-recovery','库存不足、同步失败与照顾限制','recovery',['157'],[['94','同步成功后确认喂养'],['93','返回伙伴']]),
      stage('clean','清洁伙伴','states',['95'],[['93','清洁后返回总览'],['157','已清洁或冷却反馈']]),
      stage('rest','安排休息与休息中','path',['96','175'],[['93','休息结束回到总览']]),
      stage('explore','探索与视角切换','states',['97','98','99'],[['93','完成探索回到总览']]),
      stage('growth','伙伴等级与升级反馈','states',['18'],[['93','查看伙伴与当前等级'],['74','回到应用菜单']]),
      stage('photo','从照片生成新角色','path',['51','52','53'],[['154','启用新角色'],['186','稍后在伙伴选择中查看'],['102','生成失败']]),
      stage('activate','确认更换与启用角色','path',['154','155'],[['93','启用后查看伙伴']]),
      stage('activation-recovery','角色启用异常','recovery',['156'],[['155','重试启用'],['10','返回待机']])
    ]},
    {id:'care',title:'陪伴开关与安抚反馈',sections:[
      stage('company','关闭、开启与声音安抚','path',['82','58','59','60'],[['58','反馈结束继续陪伴'],['82','关闭陪伴'],['74','返回菜单仍保留开关']]),
      stage('guidance','主动表达后的情境安抚','states',['61','62','63','64','65'],[['58','完成后继续陪伴'],['82','关闭陪伴']]),
      stage('support','需要现实中的支持','branch',['66'],[['58','回到陪伴'],['82','关闭陪伴']])
    ]},
    {id:'voice',title:'录音与回放',sections:[
      stage('save','录制、停止与本地保存','path',['70','71','122','123'],[['124','查看已保存录音']]),
      stage('recording','暂停、提醒到达与低亮录制','states',['184','81','121'],[['71','继续录制'],['122','结束并保存']]),
      stage('discard','放弃未保存的录音','branch',['125','177','42'],[['122','改为保存'],['70','删除后重新录制']]),
      stage('recovery','保存失败、空间不足与过期','recovery',['73','158','168'],[['122','重试保存'],['70','重新录制']]),
      stage('backup','备份权限、仅本地保存与云端备份结果','states',['173','171','72'],[['124','查看录音状态']]),
      stage('play','选择录音与回放','path',['124','182'],[['124','回放后返回列表']]),
      stage('delete','删除已保存录音','branch',['183'],[['182','保留并返回回放'],['124','删除后返回列表']]),
      stage('reminder','录音结束后处理提醒','branch',['164'],[['68','处理排队提醒']])
    ]},
    {id:'reminders',title:'日常：提醒与步数',sections:[
      stage('entry','日常菜单入口','path',['187'],[['77','查看提醒'],['103','查看今日步数'],['74','返回应用菜单']]),
      stage('inbox','消息列表、提醒详情与播报','path',['77','134'],[['162','播报提醒'],['68','处理到期提醒']]),
      stage('complete','提前提醒、到期与完成','path',['67','68','69'],[['77','回到消息列表']]),
      stage('later','稍后提醒与多项待办','states',['133','167'],[['68','再次到期后处理'],['134','查看某一项提醒']]),
      stage('changes','提醒已更新与空列表','states',['159','135'],[['77','查看最新消息']]),
      stage('steps','日常菜单与今日步数','path',['103'],[['187','返回日常菜单']]),
      stage('steps-recovery','计步暂不可用','recovery',['107'],[['103','重新获取步数'],['187','返回日常菜单']])
    ]},
    {id:'friends',title:'碰一碰与好友互动',sections:[
      stage('list','好友菜单与我的好友列表','path',['185','191'],[['54','碰一碰交友'],['56','查看所选好友'],['165','好友消息']]),
      stage('connect','设备接触、双方确认与好友详情','path',['54','55','176','56'],[['191','查看好友列表'],['188','添加对方已有宠物'],['144','拒绝、取消或超时']]),
      stage('import','添加对方宠物与查看伙伴','path',['188','189'],[['56','成功后回好友详情'],['186','查看并手动切换已添加伙伴']]),
      stage('import-recovery','宠物添加失败与重试','recovery',['190'],[['189','重新添加'],['56','取消并返回好友']]),
      stage('permission','社交权限异常','recovery',['169'],[['191','返回好友列表'],['185','返回好友菜单']]),
      stage('activities','好友详情中的更多互动','branch',['87'],[['56','返回好友详情'],['88','发起组队'],['141','共同创作']]),
      stage('greeting','选择问候、发送与送达','path',['136','137','138'],[['56','返回好友']]),
      stage('messages','收到问候与待发送问候','states',['57','139'],[['136','回复问候'],['137','重试发送']]),
      stage('relation','好友关系已变化','recovery',['140'],[['191','查看好友列表']]),
      stage('team','邀请组队与确认结果','path',['88','89','90'],[['141','组队后共同创作'],['144','邀请结束']]),
      stage('create','邀请共同创作与生成结果','path',['141','143','91','92'],[['154','启用新角色']]),
      stage('generation-failed','角色生成失败','recovery',['102'],[['91','重新生成']]),
      stage('accept','收到共同创作邀请','branch',['142'],[['91','接受后开始生成'],['144','拒绝或过期']]),
      stage('cancel','取消邀请与结束状态','branch',['145','144'],[['165','回到好友消息']]),
      stage('requests','好友消息与后台任务','states',['165'])
    ]},
    {id:'settings',title:'设置与隐私',sections:[
      stage('entry','设置总览与通用设置','path',['180','75'],[['31','调节音量'],['32','调节亮度'],['126','搜索并选择网络'],['178','语言选择'],['186','更换预置伙伴'],['29','回忆同步']]),
      stage('adjust','音量与亮度独立调节','states',['31','32'],[['75','返回通用设置']]),
      stage('privacy','勿扰与数据权限','states',['30','28'],[['173','录音备份权限'],['75','返回通用设置']]),
      stage('display','显示偏好','states',['172'],[['75','返回通用设置']]),
      stage('about','关于设备与系统入口','states',['181'],[['163','系统更新'],['118','关机确认']])
    ]},
    {id:'wifi',title:'更换网络与连接恢复',sections:[
      stage('change','搜索与选择网络','path',['126','109'],[['110','加密网络输入密码'],['111','开放网络直接连接'],['112','查看连接成功状态'],['180','返回设置']]),
      stage('name','密码页的网络名称详情','branch',['174'],[['110','保留输入并返回密码页']]),
      stage('switch','关闭网络与关闭状态','branch',['114','115'],[['126','重新开启并搜索']]),
      stage('recovery','无网络、密码错误与网络丢失','recovery',['127','128','129'],[['126','重新搜索'],['110','重新输入'],['109','重新选网']]),
      stage('service','离线、重连与在线服务异常','recovery',['21','22','78'],[['126','搜索网络'],['10','连接恢复后回到待机']])
    ]},
    {id:'memories',title:'回忆同步',sections:[
      stage('copy','确认范围、传输、校验与完成','path',['29','146','147','148','08'],[['180','完成后返回设置来源'],['10','待机来源完成后返回待机']]),
      stage('recovery','中断、失败与取消','recovery',['39','40','149'],[['147','恢复传输'],['29','重新确认同步范围']])
    ]},
    {id:'system',title:'充电、关机与系统维护',sections:[
      stage('charge','入座提示、充电中与已充满','path',['23','24','26'],[['10','拔出后普通待机'],['74','打开应用菜单']]),
      stage('dock-sync','底座内容同步（独立于电量）','branch',['25'],[['24','同步结束返回充电状态']]),
      stage('dock-recovery','底座接触与同步异常','recovery',['45','46','47'],[['23','重新放入底座'],['25','重试同步']]),
      stage('power','低电量、即将关机与过热','states',['33','34','48'],[['24','连接电源充电']]),
      stage('shutdown','确认关机','branch',['118'],[['01','重新开机']]),
      stage('update','检查更新、安装、完成与重启','path',['163','35','49','153'],[['01','重启后状态判断']]),
      stage('rollback','更新失败与回退','recovery',['50','100'],[['163','重试更新'],['101','无法回退时恢复系统']]),
      stage('restore','系统恢复与协助操作','path',['101','150','151'],[['153','恢复完成后重启']]),
      stage('restore-failed','系统恢复失败','recovery',['152'],[['150','重新尝试恢复']])
    ]}
  ];
  // Shared screens are previewed locally without duplicating their canonical page or routes.
  const contextual={
    'setup-network':['127','128','129','78','22'],
    'chat-recovery':['21','78','22'],
    'pet-actions':['186'],
    'pet-photo':['102','186'],
    'care-support':['21','78','22'],
    'voice-reminder':['68','69'],
    'reminders-inbox':['162'],
    'friends-connect':['144'],
    'friends-import':['186','93'],
    'friends-team':['144'],
    'friends-create':['154','155','156'],
    'friends-messages':['21','78','22'],
    'settings-entry':['178','186'],
    'settings-privacy':['173'],
    'wifi-change':['110','111','112'],
    'memories-recovery':['21','78','22']
  };
  const seen=new Set(),locations={};
  data.groups=plan.map((group,groupIndex)=>{
    const sections=group.sections.map((section,sectionIndex)=>{
      if(!kinds[section.kind])throw Error('Unknown review section kind '+section.kind);
      const sectionId=group.id+'-'+section.id;
      const ordered=section.ids.map((n,index)=>{
        if(!pages[n]||seen.has(n))throw Error('Review page missing or duplicated: '+n);
        seen.add(n);locations[n]={groupId:group.id,groupTitle:group.title,groupIndex,sectionId,sectionTitle:section.title,sectionIndex,kind:section.kind,index,total:section.ids.length};return pages[n];
      });
      for(const link of section.links)if(!pages[link.n])throw Error('Review link missing: '+link.n);
      const related=(contextual[sectionId]||[]).map(n=>{if(!pages[n])throw Error('Missing contextual page '+n);return pages[n];});
      return {id:sectionId,title:section.title,kind:section.kind,pages:ordered,links:section.links,related};
    });
    return {id:group.id,title:group.title,sections,pages:sections.flatMap(section=>section.pages)};
  });
  const missing=Object.keys(pages).filter(n=>!seen.has(n));if(missing.length)throw Error('Unassigned review pages: '+missing.join(', '));
  data.version='Fox module-layout revision 2026-09-14';
  data.summary=seen.size+' 页按模块集中排列；角色管理归入我的伙伴，备份权限归入录音；主流程、结果与异常就近展示，共用画面接续当前网格；设备交互不变。';
  global.FoxFlow=Object.freeze({kinds,locations,sectionCount:data.groups.reduce((count,g)=>count+g.sections.length,0)});
})(typeof window!=='undefined'?window:globalThis);
