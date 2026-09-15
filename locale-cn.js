(function () {
  'use strict';
  const dictionary = {
    'Charging started':'已开始充电','Fully charged':'已充满','Charging paused':'充电已暂停','Charging':'充电中','Battery is full':'电量已满','Charging will resume when the dock is ready':'底座准备好后将恢复充电','Keep LG01 on the dock':'请将设备保持在底座上','Swipe up for menu':'上滑打开菜单',
    'App setup':'App 设置','Connect to the app':'连接 App','Open the LUMIQ app':'打开 LUMIQ App','Connect this phone?':'连接这部手机？','Check the phone nearby':'确认手机在附近','Not now':'暂不连接','Connect':'连接','Connecting':'正在连接','Keep phone nearby':'请将手机放在附近','Connected':'已连接','Setting up Wi-Fi':'正在设置 Wi-Fi','Choose Wi-Fi':'选择 Wi-Fi','Choose network':'选择网络','Search again':'再次搜索','Finding Wi-Fi':'正在查找 Wi-Fi','No Wi-Fi found':'未找到 Wi-Fi','Wi-Fi disappeared':'Wi-Fi 已消失','Wi-Fi password':'Wi-Fi 密码','Password':'密码','Password did not work':'密码不正确','Edit password':'修改密码','Join':'加入','Cancel':'取消','Back':'返回','Continue':'继续','Skip':'跳过','Retry':'重试','Try again':'再试一次','Done':'完成','Confirm':'确认','Close':'关闭','Later':'稍后','Resume':'继续','Install':'安装','Keep on':'保持开启','Turn off':'关闭','Turn on':'开启','End':'结束','Stop':'停止','Play':'播放','Show':'显示','Hide':'隐藏',
    'Memories':'记忆','Memories ready':'记忆已准备好','Added to this device':'已添加到设备','Share these memories?':'要分享这些记忆吗？','Chosen in the app':'已在 App 中选择','Copying memories':'正在复制记忆','Checking memories':'正在检查记忆','Copying stopped':'复制已停止','Your old memories stay':'旧记忆会保留','Waiting for the device':'等待设备','Could not copy':'无法复制','Copying paused':'复制已暂停','Soul Link':'Soul Link','Character':'角色','Choose a character':'选择角色','In the LUMIQ app':'在 LUMIQ App 中','Use Lumi':'使用 Lumi','Character not ready':'角色尚未准备好','Lumi is still here':'Lumi 还在这里','Getting ready':'准备中','Good morning':'早上好','Good night':'晚安','Hello there':'你好','See you soon':'待会儿见',
    'Chat':'对话','AI chat':'AI 对话','AI chat / Mic on':'AI 对话 / 麦克风开启','Listening':'正在听','Thinking':'思考中','Speaking':'正在说话','Chat ended':'对话结束','Not listening':'未在聆听','Chat again':'再次对话','Your voice is sent online.':'你的声音会发送到线上服务。','Mic on':'麦克风开启','Mic off':'麦克风关闭','Microphone':'麦克风','Turn mic on':'开启麦克风','Turn mic off':'关闭麦克风','Audio':'音频','Playing':'播放中','AI privacy':'AI 隐私','About AI chat':'关于 AI 对话',
    'Quiet time':'安静时段','Quiet mode':'安静模式','Prompts stay silent':'提醒保持静音','Turn quiet off':'关闭安静模式','Turn quiet on':'开启安静模式','Controls':'控制','Sound and light':'声音和亮度','Display':'显示','Weather':'天气','Battery':'电量','Connection':'连接','Online service':'线上服务','No Wi-Fi':'无 Wi-Fi','Charging':'充电中','On the dock':'正在底座上','Battery full':'电量已满','Time to charge':'需要充电','Place LG01 on the dock':'请将 LG01 放到底座上',
    'Menu':'菜单','Voice note':'语音记录','Reminders':'提醒','Care':'照顾','My character':'我的角色','Steps':'步数','Friend updates':'好友动态','Continue setup':'继续设置','Quick Controls':'快捷控制','Quick apps':'快捷应用','Online backup':'线上备份','Device help':'设备帮助','System':'系统','Power':'电源','Update':'更新',
    'Feed':'喂食','Clean':'清洁','Clean up':'清理','Explore':'探索','Rest':'休息','A small treat':'小点心','A fresh start':'焕然一新','15 min to recharge':'休息 15 分钟','Ready now':'现在可以','Feeling good':'状态不错','Not hungry':'不饿','All clean':'已经干净','Full of energy':'精力充沛','Resting':'休息中','End rest':'结束休息','After resting':'休息后','A little adventure':'来一次小探索','Feeling full':'已经吃饱','Looking fresh':'看起来很清爽','Time to freshen up':'该清理一下了','Resting now':'正在休息','Explore later':'稍后探索',
    'Start Care?':'开始照顾？','Mic on for 30 minutes':'麦克风开启 30 分钟','Start Care':'开始照顾','Ready to update?':'准备更新？','Updating':'正在更新','Update finished':'更新完成','Restarting LG01':'正在重启 LG01','Fixing the update':'正在修复更新','Power off':'关机','Turn LG01 off?':'关闭 LG01？','Connection timed out':'连接超时','Could not connect':'无法连接','Still thinking':'还在思考','Let\'s pause':'先暂停一下','I did not hear that':'没有听清','Recording deleted':'录音已删除','Your recording is saved':'录音已保存','New move':'新动作','A new move':'一个新动作','Today':'今天','For you':'给你','A little moment':'稍等一下',
    'Screen off':'关闭屏幕','Show clock':'显示时钟','After 30 seconds':'30 秒后','Time and battery':'时间和电量','Ready to go':'准备好了','Cannot connect yet':'暂时无法连接','Wi-Fi is off':'Wi-Fi 已关闭','AI chat is unavailable':'AI 对话不可用','AI chat will be unavailable':'AI 对话将不可用','Place on dock':'放到底座上','Leave it on the dock':'保持在底座上','Leave LG01 on the dock':'请将 LG01 留在底座上',
    'Needs a password':'需要密码','No password':'无需密码','Wi-Fi connected':'Wi-Fi 已连接','Online service ready':'线上服务已就绪','Setup':'设置','Finish setting up?':'完成设置？','Hi, I\'m Lumi':'你好，我是 Lumi','Wed, Sep 9':'9 月 9 日，周三','Sunny':'晴','Reconnecting':'正在重新连接','of':'/','On':'开启','Off':'关闭','Volume':'音量','Brightness':'亮度','App permission':'App 权限','Turn Wi-Fi off?':'关闭 Wi-Fi？','Weather is not ready':'天气暂不可用','Quiet is off':'安静模式已关闭','Reminders can play sounds':'提醒可以播放声音','Reminders stay silent':'提醒保持静音','App help':'App 帮助','Getting LG01 ready':'正在准备 LG01','LG01 still needs help':'LG01 仍需要帮助','Try again in the app':'请在 App 中重试','Restarting':'正在重启','Check the dock':'检查底座','Place LG01 on it again':'请再次将 LG01 放到底座上','LG01 is too warm':'LG01 温度过高','Let it cool down':'请等待设备冷却','did not finish':'未完成','You can still use LG01':'你仍然可以使用 LG01','Get help':'获取帮助','Open the app together':'一起打开 App','New character':'新角色','Make a toy character':'创建玩具角色','Add a photo in the app':'在 App 中添加照片','Making a character':'正在创建角色','New character ready':'新角色已准备好','Use character':'使用角色','Friends':'好友','Someone is nearby':'附近有人','Choose how to connect':'选择连接方式','Choose':'选择','Be friends?':'成为好友？','With Milo':'与 Milo 一起','Send invite':'发送邀请','Friends with Milo':'与 Milo 成为好友','Say hello':'打招呼','From Milo':'来自 Milo','A hello from Milo':'Milo 发来的问候','Reply':'回复','Team up':'组队','Team up with Milo':'与 Milo 组队','Team up with Milo?':'要与 Milo 组队吗？','Waiting for Milo':'等待 Milo','You are teammates':'你们已成为队友','You and Milo':'你和 Milo','Create together':'一起创建','Create with Milo':'与 Milo 一起创建','Create with Milo?':'要与 Milo 一起创建吗？','Use your characters\' looks':'使用你们角色的外观','Invite closed':'邀请已关闭','Cancel this invite?':'取消这份邀请？','Keep invite':'保留邀请','Cancel invite':'取消邀请','Use this character?':'使用这个角色？','Lumi stays in your collection':'Lumi 会保留在你的收藏中','Changing character':'正在更换角色','Could not change':'无法更换','From Milo':'来自 Milo','Waiting for a reply':'等待回复','Up to 1 minute':'最多 1 分钟','Sent to Milo':'已发送给 Milo','Not sent yet':'尚未发送','Waiting for a connection':'等待连接','Cannot connect now':'暂时无法连接','Check friends in the app':'请在 App 中查看好友','Send a hello':'发送问候','Wave':'挥手','High five':'击掌','Cheer':'欢呼','Invite closed':'邀请已关闭','Not ready yet':'还没准备好','Check again for your character':'再次检查角色状态','Check status':'查看状态','Far view':'远景','Close-up':'近景','My character':'我的角色','Snack time':'点心时间','Time to rest':'该休息了','Ready':'准备好','Reminder':'提醒','Bring your umbrella':'带上雨伞','In 30 min':'30 分钟后','Due now':'现在到时间','10 min later':'10 分钟后','Mark done':'标记完成','Marked as done':'已标记完成','Details':'详情','Remind me in':'提醒我在','10 minutes':'10 分钟','Make a voice note':'创建语音记录','Saved in the app':'已保存到 App','Up to 1 minute':'最多 1 分钟','Record':'录音','Recording':'录音中','Still recording':'仍在录音','A reminder is waiting':'有一条提醒待处理','Saving your recording':'正在保存录音','Saved on LG01':'已保存在 LG01','Not backed up online':'尚未备份到线上','Only on this device':'仅保存在本设备','Saved notes':'已保存的记录','No voice notes yet':'还没有语音记录','Keep this recording?':'保留这段录音吗？','Recording has stopped':'录音已停止','Save':'保存','Delete':'删除','No updates yet':'暂无更新','Updates':'更新','steps':'步数','steps today':'今日步数','are not ready':'暂不可用','later':'稍后','View':'查看','Reminder updated':'提醒已更新','Check the new reminder':'查看新的提醒','View update':'查看更新','Recording is gone':'录音已消失','It could not be kept after 24 hours.':'超过 24 小时后无法保留。','Delete this recording?':'删除这段录音？','This cannot be undone.':'此操作无法撤销。','Keep':'保留','More':'更多','Need setup':'需要设置','Breathe with me':'和我一起呼吸','Take a slow breath':'慢慢呼吸','Pause and breathe':'暂停一下，呼吸','I am here':'我在这里','Pause for a moment':'暂停一会儿','Star breaths':'星星呼吸','Find a trusted adult':'找一位信任的成年人','Care ended':'照顾结束','Start again':'重新开始','Want a quiet moment?':'想要安静一会儿吗？','Yes, please':'好的','Stop Care':'停止照顾','Care is on':'照顾已开启','Make a voice note':'创建语音记录','Name':'名称','Things you like':'你喜欢的事物','Important dates':'重要日期','Recent moments':'最近的时刻','3 of 4':'4 项中的 3 项','Copying memories':'正在复制记忆','1x':'1 倍','0.6x':'0.6 倍','2x':'2 倍','Close-up':'近景','No invites yet':'暂无邀请','Saved notes':'已保存记录','Record again':'再次录音','Save or delete':'保存或删除','Complete':'完成','Ready now':'现在可以','is low':'偏低','is on':'已开启','is not ready':'尚未准备好','in the app':'在 App 中','or later':'或稍后','for':'给','today':'今天','the app':'App'
  };
  ['of','for','in the app','later','is on','is low','are not ready','or later','the app'].forEach(key => delete dictionary[key]);
  Object.assign(dictionary, {
    // Use Chinese labels for generic UI terms in the preview. Product and
    // character names (LG01, LUMIQ, Lumi and Milo) remain unchanged.
    'LUMIQ App':'LUMIQ 应用','Open the app':'打开应用','the app':'应用','App':'应用',
    'Wi-Fi':'无线网络','WiFi':'无线网络','AI chat':'智能对话','AI':'智能',
    'Soul Link':'灵魂连接','Quick Controls':'快捷控制','Quick Apps':'快捷应用',
    'Menu':'菜单','Companion':'陪伴','Avatar':'角色','Explore':'探索','Clean':'清洁',
    'Note':'记录','Care':'照顾','Mute':'静音','Quiet':'安静','REC':'录音','OTA':'系统更新',
    'Listening':'聆听中','Thinking':'思考中','Speaking':'说话中','Unknown':'未知','Allow':'允许',
    'Deny':'拒绝','Revoked':'已撤销','Granted':'已允许','Denied':'已拒绝','UI':'界面','revised':'已修订','revised ':'已修订',
    '24 hours left to save':'还剩 24 小时可保存','Coming up':'即将到时','Waiting for Wi-Fi':'等待无线网络','Join in':'加入','Connect with Milo':'与 Milo 连接','Connecting with Milo':'正在与 Milo 连接'
  });
  Object.assign(dictionary, {
    'Try searching again':'再次搜索','Wi-Fi network':'Wi-Fi 网络','Needs a password':'需要密码','Wi-Fi connected':'Wi-Fi 已连接','Online service ready':'线上服务已就绪','Wi-Fi is off':'Wi-Fi 已关闭','Weather is not ready':'天气暂不可用','Quiet is off':'安静模式已关闭','Reminders can play sounds':'提醒可以播放声音','App help':'App 帮助','Getting LG01 ready':'正在准备 LG01','LG01 still needs help':'LG01 仍需要帮助','Try again in the app':'请在 App 中重试','Restarting':'正在重启','Check the dock':'检查底座','Place LG01 on it again':'请再次将 LG01 放到底座上','LG01 is too warm':'LG01 温度过高','did not finish':'未完成','You can still use LG01':'你仍然可以使用 LG01','Get help':'获取帮助','Open the app together':'一起打开 App','New character':'新角色','Make a toy character':'创建玩具角色','Add a photo in the app':'在 App 中添加照片','Making a character':'正在创建角色','New character ready':'新角色已准备好','Use character':'使用角色','Friends':'好友','Someone is nearby':'附近有人','Choose how to connect':'选择连接方式','Choose':'选择','Be friends?':'成为好友？','With Milo':'与 Milo 一起','Send invite':'发送邀请','Friends with Milo':'与 Milo 成为好友','Say hello':'打招呼','From Milo':'来自 Milo','A hello from Milo':'Milo 发来的问候','Reply':'回复','Team up':'组队','Team up with Milo':'与 Milo 组队','Team up with Milo?':'要与 Milo 组队吗？','Waiting for Milo':'等待 Milo','You are teammates':'你们已成为队友','You and Milo':'你和 Milo','Create together':'一起创建','Create with Milo':'与 Milo 一起创建','Create with Milo?':'要与 Milo 一起创建吗？','Use your characters\' looks':'使用你们角色的外观','Invite closed':'邀请已关闭','Cancel this invite?':'取消这份邀请？','Keep invite':'保留邀请','Cancel invite':'取消邀请','Use this character?':'使用这个角色？','Lumi stays in your collection':'Lumi 会保留在你的收藏中','Changing character':'正在更换角色','Could not change':'无法更换','Waiting for a reply':'等待回复','Up to 1 minute':'最多 1 分钟','Up to 1 min':'最多 1 分钟','Sent to Milo':'已发送给 Milo','Not sent yet':'尚未发送','Waiting for a connection':'等待连接','Cannot connect now':'暂时无法连接','Check friends in the app':'请在 App 中查看好友','Send a hello':'发送问候','Wave':'挥手','High five':'击掌','Cheer':'欢呼','Not ready yet':'还没准备好','Check again for your character':'再次检查角色状态','Check status':'查看状态','Far view':'远景','Close-up':'近景','Snack time':'点心时间','Time to rest':'该休息了','Ready':'准备好','Reminder':'提醒','Bring an umbrella':'带上雨伞','In 30 min':'30 分钟后','Due now':'现在到时间','10 min later':'10 分钟后','Mark done':'标记完成','Marked as done':'已标记完成','Details':'详情','Remind me in':'提醒我在','10 minutes':'10 分钟','Make a voice note':'创建语音记录','Saved in the app':'已保存到 App','Record':'录音','Recording':'录音中','Still recording':'仍在录音','A reminder is waiting':'有一条提醒待处理','Saving your recording':'正在保存录音','Saved on LG01':'已保存在 LG01','Not backed up online':'尚未备份到线上','Only on this device':'仅保存在本设备','Saved notes':'已保存记录','No voice notes yet':'还没有语音记录','Keep this recording?':'保留这段录音吗？','Recording has stopped':'录音已停止','Save':'保存','Delete':'删除','No updates yet':'暂无更新','Updates':'更新','steps':'步数','steps today':'今日步数','are not ready':'暂不可用','View':'查看','Reminder updated':'提醒已更新','Check the new reminder':'查看新的提醒','View update':'查看更新','Recording is gone':'录音已消失','It could not be kept after 24 hours.':'超过 24 小时后无法保留。','Delete this recording?':'删除这段录音？','This cannot be undone.':'此操作无法撤销。','Keep':'保留','More':'更多','Need setup':'需要设置','Breathe with me':'和我一起呼吸','Take a slow breath':'慢慢呼吸','Pause and breathe':'暂停一下，呼吸','I am here':'我在这里','Pause for a moment':'暂停一会儿','Star breaths':'星星呼吸','Find a trusted adult':'找一位信任的成年人','Care ended':'照顾结束','Start again':'重新开始','Want a quiet moment?':'想要安静一会儿吗？','Yes, please':'好的','Stop Care':'停止照顾','Care is on':'照顾已开启','Name':'名称','Things you like':'你喜欢的事物','Important dates':'重要日期','Recent moments':'最近的时刻','3 of 4':'4 项中的 3 项','1x':'1 倍','0.6x':'0.6 倍','2x':'2 倍','No invites yet':'暂无邀请','Record again':'再次录音','Save or delete':'保存或删除','Complete':'完成','Ready now':'现在可以','is low':'偏低','is on':'已开启','Quiet':'安静模式','Sending':'正在发送','To Milo':'发给 Milo','All set':'已准备好','Friends need setup':'好友需要先设置','Backup needs setup':'备份需要设置','Change this in the app':'请在 App 中修改','No space to record':'没有足够空间录音','Manage recordings in the app':'请在 App 中管理录音','Need setup':'需要设置','Check the dock':'检查底座','Take a break':'休息一下','Updated':'已更新','LG01 needs help':'LG01 需要帮助','连接 with Milo':'与 Milo 连接','加入 in':'加入','对话 unavailable':'对话不可用','Try again later':'稍后再试','再试一次 later':'稍后再试','15:00 left':'还剩 15:00','Could not save':'无法保存','Your recording is kept for 24 hours.':'你的录音会保留 24 小时。','完成 or later':'完成或稍后','Bring an umbrella':'带上雨伞','Take a break':'休息一下'
  });
  Object.assign(dictionary, { with: '与', in: '在', unavailable: '不可用', 'or later': '或稍后', 'Wi-Fi setup': '无线网络设置', 'Scan to set up': '扫码配网', 'Use the LUMIQ app to scan': '使用 LUMIQ App 扫描二维码', 'Waiting for the app': '等待 App 配网', 'Finish setup in the LUMIQ app': '请在 LUMIQ App 中完成设置' });
  Object.assign(dictionary, {'Settings':'设置','Quick controls':'快捷控制','Apps':'应用','AI Chat':'智能对话','Voice Note':'录音','Voice notes':'录音记录','Language':'语言','Choose a language':'选择语言','About':'关于','Software':'软件版本','Model':'型号','Code expired':'二维码已过期','Get a new code':'刷新后重新扫码','Refresh code':'刷新二维码','Scan with the LUMIQ app':'用 LUMIQ 应用扫码','Finish on your phone':'请在手机上完成','Choose Wi-Fi in the LUMIQ app':'在 LUMIQ 应用选择网络','Choose here':'在设备上选','Choose a companion':'选择伙伴','Set up with QR':'扫码配网','Invites':'邀请','Requests and replies':'邀请和回复','Paused':'已暂停','Resume':'继续','Delete recording':'删除录音','Saved on device':'已保存在设备','Nothing saved yet':'还没有录音','Record a thought':'记录一个想法','Name and looks only':'仅名称与外观','No audio yet':'暂无录音','Listening...':'正在听','Inhale':'吸气','Exhale':'呼气','Turn mic on':'开启麦克风','Cancel':'取消','Not now':'暂不','Play recording':'播放录音','Pause playback':'暂停播放','Friend invite':'好友邀请','Team invite':'组队邀请','UI prototype · 2026.09.12':'界面原型 · 2026.09.12','Select':'选择','Invites and replies':'邀请与回复','Saved recordings':'已保存录音','Unsaved recording':'未保存录音','Try saving again':'再次保存','Sending to the app':'正在备份','Only on LG01':'仅保存在设备','Online backup is on':'已开启云备份','Online backup is off':'已关闭云备份','Already done':'已完成','Time ran out':'已超时','Cancelled':'已取消','Not accepted':'未同意','Feeling rested':'休息好了','A snack sounds good':'可以吃点心了','Taking a little rest':'正在休息','Time for some care':'照顾一下伙伴吧','Resting now':'正在休息','Snack later':'稍后再喂','Clean later':'稍后清理','Home':'家中网络','Guest':'访客网络','Scan again':'重新扫码'});
  Object.assign(dictionary,{'Check Wi-Fi password':'请检查网络密码','Edit it in the LUMIQ app':'请在 LUMIQ 应用修改'});
  Object.assign(dictionary,{'Listening':'正在听','Speaking':'正在说话','Chat again':'再聊一次','Voice note':'录音','Saved notes':'已存录音','Pairing QR code':'配网二维码','Starting':'正在开机','Pause':'暂停','Playback position':'播放进度','Send voice':'发送语音','Interrupt':'打断回答','List pages':'列表分页','Previous list page':'上一组','Next list page':'下一组','Fox 完整交互':'完整交互'});
  Object.assign(dictionary,{'Options':'选项','Requests':'邀请','Pending notes':'待备份录音'});
  Object.assign(dictionary,{'Device setup':'设备连接','Connect main device?':'连接主设备？','Check the device nearby':'确认设备在附近','Connecting to device':'正在连接设备','Keep device nearby':'请将设备放在附近','OK':'好的',"I'm full now":'我吃饱啦','Thanks for caring':'谢谢你的照顾',"I'm all clean":'我已经干净啦','A snack later?':'等会儿再吃吧','A little break?':'让我歇一会儿',"I'm resting":'我在休息哦','See you after my rest':'休息好了再一起玩','Ready to play':'我精神满满','Ready to explore':'一起去探索吧','View full network name':'查看完整网络名称','Password hidden':'密码已隐藏','Switch keyboard':'切换键盘','Space':'空格','Delete character':'删除字符','Next keyboard page':'下一组字符'});
  Object.assign(dictionary, {
    'Good to see you':'很高兴见到你',"Hi, I'm":'你好，我是','Hello there':'嗨，你好','Good night':'晚安，好好休息','See you soon':'一会儿见','From the device and app':'来自设备和 App',
    'Something to share':'想和你分享','From daily content':'来自每日内容','A little moment':'今日小分享','Hear it':'听听看','A new move for you':'给你看个新动作',
    'Listening':'我在听','Thinking':'让我想想','Speaking':'说给你听','Thanks for chatting':'谢谢你和我聊天','Chat again':'再聊聊',
    'I missed that':'刚才没听清','I could not answer this time':'这次没能回答',"Let's try another topic":'我们换个话题吧',
    'Connect to chat again':'连上网络再聊吧','Service is not connected':'服务暂时连不上','Chat is not available now':'暂时聊不了',
    'Could not connect':'暂时没连上','Network is out of reach':'找不到这个网络了','Could not change':'这次没换成功',
    'Care':'陪伴','Start Care?':'要我陪你一会儿吗？','Start Care':'开始陪伴','Stop Care':'结束陪伴','Care is on':'我在陪着你','Care ended':'这次陪伴结束啦',
    'Want me to keep you company?':'要我陪你一会儿吗？','Keep me company':'开始陪伴','No thanks':'先不用',"Let's try":'一起试试',
    'Mic will be on for 30 min':'麦克风将开启 30 分钟',"I'm keeping you company":'我在陪着你','Shall we take a break?':'一起歇一会儿吗？',
    'Breathe slowly with me':'和我一起慢慢呼吸','One slow breath':'慢慢吸气，再呼气','Take a little pause':'先停一下，缓口气',
    'It is OK to take a break':'歇一会儿也没关系','Rest a moment first':'先歇一会儿吧','Breathe with the stars':'跟着星星慢慢呼吸',
    'Talk to a trusted adult':'找信任的大人聊聊','Our time together has ended':'这次陪伴结束啦','Mic capture stopped':'已停止收音','Time remaining':'剩余时间',
    'What would you like to remember?':'想记下什么呢？','Nothing saved yet':'还没有录音','No voice notes yet':'还没有录音',
    'Recording saved':'录音存好啦','Recording not saved yet':'录音还没存好','Recording has expired':'录音已过期',
    'Recording is gone':'录音已过期','It could not be kept after 24 hours.':'超过 24 小时，已自动删除',
    'This cannot be undone.':'删除后无法恢复','Your recording is kept for 24 hours.':'录音暂存 24 小时','Could not save':'录音还没存好',
    'A reminder is waiting':'有提醒等你查看','Your recording is saved':'录音已保存','Try saving again':'重试保存','Save or delete':'处理录音',
    'Messages':'消息','No new messages yet':'还没有新消息','Updates':'消息','No updates yet':'还没有新消息',
    'To-do reminders':'待办提醒','No reminders waiting':'暂无待办提醒','Due now':'待处理','Coming up':'未到时间','Already done':'已完成',
    'Mark done':'完成了','Marked as done':'这件事完成啦','Done or later':'处理提醒','I will remind you':'我会再提醒你','In 10 min':'10 分钟后',
    'Reminder updated':'提醒已更新','View update':'查看提醒','steps':'步','Feeling good':'今天状态不错','Time for some care':'来看看伙伴吧',
    'Not hungry':'吃饱啦','All clean':'干净啦','Full of energy':'精神满满','Feeling full':'吃饱啦','Looking fresh':'清清爽爽',
    'Time to freshen up':'洗干净，一身轻松','Feeling rested':'休息好啦','That was fun!':'一起玩真开心','Yum! Thank you':'真好吃，谢谢你','All clean!':'洗干净啦',
    'Say hello':'打个招呼','Send a hello':'打个招呼','Sent to Milo':'问候已送到 Milo','You are teammates':'你们是队友啦',
    'Friends with Milo':'和 Milo 成为好友啦','Be friends?':'交个朋友吧？','A hello from Milo':'Milo 向你打招呼',
    'Create together':'一起创作','Create with Milo?':'和 Milo 一起创作？','New character ready':'新伙伴来啦','Check again for your character':'看看伙伴准备好了吗',
    'Memories':'回忆','Share these memories?':'同步这些回忆？','Memories ready':'回忆同步好啦','Added to this device':'已存入这台设备',
    'Copying memories':'正在同步回忆','Checking memories':'正在检查回忆','Copying stopped':'同步已停止','Copying paused':'同步已暂停',
    'Could not copy':'回忆还没同步好','Your old memories stay':'原有回忆会保留','Things you like':'喜欢的事','Recent moments':'最近的点滴',
    'New move':'新动作','Online backup':'云备份','Online service':'在线服务','Recording note':'录音',
    'No audio yet':'未找到这段录音','Keep this recording?':'要留下这段录音吗？',
    'Also in the app':'设备和应用均已保存','In the app':'已备份到应用',
    'Capture paused':'收音已暂停','Not capturing':'未在收音',
    'Your voice is sent online.':'你的声音会发送到在线服务',
    'No Wi-Fi':'还没连上网络','Wi-Fi switch':'网络开关','Current network':'当前网络',
    'Be friends with Milo?':'和 Milo 交个朋友？','No result yet':'还没收到结果','Not backed up online':'尚未备份到云端'
  });
  Object.assign(dictionary,{'Companion listening':'陪伴正在聆听','Companion on':'陪伴已开启','Companion off':'陪伴已关闭','Here when you need me':'需要时，我在','I am here with you':'我在这里，慢慢来','Listens to your voice when on':'开启后聆听你的声音与表达','Listening paused':'暂停聆听','I am here. Take your time':'我在呢，不着急','Quiet for now':'先安静会','Breathe together':'一起呼吸','Turn on':'开启','Turn off':'关闭','Daily':'日常','Re-enter':'重新输入','Network name':'网络名称','Selected network':'当前所选网络','Full network name':'完整网络名称','Care for companion':'照顾伙伴',"Today's steps":'今日步数','From this device':'来自本机计步','Turn Wi-Fi off':'关闭无线网络'});
  Object.assign(dictionary,{'General settings':'通用设置','Growth':'成长','Level up':'升级啦','My companion':'我的伙伴','Switch companion':'切换伙伴','Connection timed out. Choose a network.':'连接超时，请重新选择网络'});
  Object.assign(dictionary,{'Tap to make friends':'碰一碰交友','Bring the two devices together':'让两台设备碰一碰','Be friends':'交朋友','Add companion':'添加宠物','Add this companion?':'将对方宠物添加到本机？','Adding companion':'正在添加宠物','Could not add companion':'宠物还没添加成功','My companions':'我的伙伴','Add':'添加','Manage companions':'管理伙伴','Previous companion':'上一个伙伴','Next companion':'下一个伙伴'});
  Object.assign(dictionary,{'Social access needs permission':'请在应用中允许社交','Friend is unavailable':'好友关系已失效','Connect to Wi-Fi':'请先连接无线网络','Not enough space':'设备空间不足','Adding companion timed out':'添加伙伴超时'});
  Object.assign(dictionary,{'More interactions':'更多互动','Sync purchases':'同步购买内容','Syncing purchases':'正在同步购买内容','Could not sync purchases':'购买内容同步失败','Buy food in the app':'请在应用中购买食物'});
  Object.assign(dictionary,{'No food yet':'暂无食物','Feed 1 portion':'喂养 1 份','Waiting for the app':'等待应用同步','Invitation declined':'对方暂未接受','Invitation timed out':'邀请已超时','Invitation cancelled':'邀请已取消'});
  Object.assign(dictionary,{'Companion is unavailable':'伙伴暂不可用','Choose a companion':'请选择伙伴'});
  Object.assign(dictionary,{'Photo character':'照片角色','Waiting for a photo':'等待照片','Could not make character':'角色生成失败','Sync reminders':'同步提醒','Syncing reminders':'正在同步提醒','Reminder sync failed':'提醒同步失败','Reminders not synced':'提醒尚未同步','Connect to Wi-Fi and try again':'联网后再试一次'});
  Object.assign(dictionary,{'My friends':'我的好友','Friend messages':'好友消息','Friend updates':'好友消息','No friends yet':'还没有好友','Companion:':'伙伴：','Unread friend messages':'有未读好友消息','Friend messages, unread':'好友消息，有未读消息'});
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function translate(value) {
    let output = value
      .replace(/\bLevel (\d+)\b/g, '等级 $1')
      .replace(/\b(\d+) hours? left to save\b/g, '还剩 $1 小时可保存')
      .replace(/\b(\d+) minutes? left to save\b/g, '还剩 $1 分钟可保存')
      .replace(/\bIn (\d+) min\b/g, '$1 分钟后')
      .replace(/\bReady in (\d+) min\b/g, '$1 分钟后可以')
      .replace(/\b(\d{1,2}:\d{2}) left\b/g, '还剩 $1');
    keys.forEach(key => { output = output.replace(new RegExp('(^|[^A-Za-z])' + escaped(key) + '(?=$|[^A-Za-z])', 'g'), match => match.replace(key, dictionary[key])); });
    return output
      .replace(/\bApp\b/g, '应用')
      .replace(/\bWi-Fi\b/g, '无线网络')
      .replace(/\bAI\b/g, '智能')
      .replace(/\bUI\b/g, '界面')
      .replace(/\bSoul Link\b/g, '灵魂连接')
      .replace(/\b(Ready in) (\d+) min\b/g, '$2 分钟后可以')
      .replace(/\b(\d+) min left\b/g, '还剩 $1 分钟')
      .replace(/\b(\d+) reminders\b/g, '$1 条提醒')
      .replace(/无线网络 网络/g, '无线网络')
      .replace(/加入在/g, '加入')
      .replace(/连接 与 /g, '与 ')
      .replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, '$1$2')
      .replace(/(\d+) food portions available/g, '$1 份食物可用');
  }
  window.FoxLocale = { translate, translateMarkup };
  return;
  const sourceRender = window.LG01Screen.render;
  function translateMarkup(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE) {if(!node.parentElement?.closest('[translate="no"]'))node.nodeValue = translate(node.nodeValue);}
      else ['aria-label', 'title', 'placeholder'].forEach(name => { if (node.hasAttribute(name)) node.setAttribute(name, translate(node.getAttribute(name))); });
    });
    const screenId = template.content.querySelector('.device-screen')?.dataset.screenId;
    if (['59', '82'].includes(screenId)) {
      template.content.querySelectorAll('*').forEach(node => {
        [...node.childNodes].filter(child => child.nodeType === Node.TEXT_NODE).forEach(child => {
          child.nodeValue = child.nodeValue.replace(/暂不连接/g, '稍后');
        });
      });
    }
    return template.content.firstElementChild.outerHTML;
  }
  function translatePageMetadata() {
    const data = window.LG01_DATA;
    if (!data?.groups) return;
    data.groups.forEach(group => {
      ['title', 'summary'].forEach(field => { if (typeof group[field] === 'string') group[field] = translate(group[field]); });
      group.pages?.forEach(page => {
        ['title', 'summary', 'tag', 'status', 'trigger', 'feedback', 'edge'].forEach(field => {
          if (typeof page[field] === 'string') page[field] = translate(page[field]);
        });
      });
    });
    Object.values(data.transitions || {}).forEach(routes => routes.forEach(route => {
      ['label', 'guard', 'effect'].forEach(field => {
        if (typeof route[field] === 'string') route[field] = translate(route[field]);
      });
    }));
  }
  function translateShell() {
    const root = document.body;
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('script,style,textarea')) nodes.push(node);
    }
    nodes.forEach(node => { node.nodeValue = translate(node.nodeValue); });
    root.querySelectorAll('[aria-label],[title],[placeholder]').forEach(node => {
      ['aria-label', 'title', 'placeholder'].forEach(name => {
        if (node.hasAttribute(name)) node.setAttribute(name, translate(node.getAttribute(name)));
      });
    });
    root.querySelectorAll('input,textarea').forEach(node => {
      if (node.value) node.value = translate(node.value);
    });
  }
  translatePageMetadata();
  translateShell();
  window.LG01Screen = Object.freeze({ ...window.LG01Screen, render: (page, context) => translateMarkup(sourceRender(page, context)) });
})();
