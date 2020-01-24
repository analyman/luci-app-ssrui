/* Constants, such message */

export var NewOption     = "NEW";
export var NewButtonName = "NEW";

export var AddNewSubs    = "Add new subscription";

export var Server             = "Server";
export var Server_Port        = "Server Port";
export var Local_Address      = "Local Address";
export var Local_Port         = "Local Port";
export var Password           = "Password";
export var Method             = "Method";
export var Protocol           = "Protocol";
export var Protocol_Parameter = "Protocol Parameter";
export var Obfs               = "Obfs";
export var Obfs_Parameter     = "Obfs Parameter";

export var BeginUpdate = "begin update";

export var URL_ERROR   = 'Please input correct url, like "http://example.com/example"';
export var UPDATEIT    = 'Please subscribe new ssr subscription in order to keep it.'
export var GIVEMEADDR  = 'Give me a address !!!';
export var DONTTRYIT   = "don't try this, no result !!!";
export var SUBSFAIL    = "Subscribe fail !!!";
export var SYNCROWITH  = "syncronize server with local data ? If you confirm to do that, click confirm button.";
export var EMPTYSERVERS = "There is none of valid server, failed.";
export var UNKNOWNERROR = "UNKOWN ERROR !";
export var SYNCFAIL     = "Syncronization fail";
export var SYNCSUCCESS  = "Syncronization success";
export var GET_SERVER_FAIL    = "Get ssr subscription info from server fail, refresh this page to retry";
export var GET_SERVER_SUCCESS = "Get ssr subscription info from server success";

export var TEST_FAIL = "TEST WITH NO RESULT, FAIL!";
export var TEST_SUCCESS = "Get the test result";
export var TEST_WAIT = "Already send test request, please wait a moment";

export var INPUT_NAME = "Input the name of this url";

if (window.navigator.language == "en") {
    NewOption     = "添加";
    NewButtonName = "添加";

    AddNewSubs    = "添加新订阅";

    Server             = "服务器";
    Server_Port        = "服务器端口";
    Local_Address      = "本地地址";
    Local_Port         = "本地端口";
    Password           = "密码";
    Method             = "加密方法";
    Protocol           = "协议";
    Protocol_Parameter = "协议参数";
    Obfs               = "混淆插件";
    Obfs_Parameter     = "混淆参数";

    BeginUpdate = "开始更新订阅 ...";

    URL_ERROR   = '输入正确的地址, 格式如 "http://example.com/example"';
    UPDATEIT    = '添加订阅后请更新订阅, 否则订阅地址不会保存.'
    GIVEMEADDR  = '来个正确的地址.';
    DONTTRYIT   = "不要做没有结果的事情";
    SUBSFAIL    = "订阅失败啦!";
    SYNCROWITH  = "是否将服务器订阅数据与本地同步? 如果确认, 点击确认按钮.";
    EMPTYSERVERS = "想要同步, 先添加服务器或者订阅, 再见!";
    UNKNOWNERROR = "未知错误";
    SYNCFAIL     = "同步失败";
    SYNCSUCCESS  = "同步成功";
    GET_SERVER_FAIL    = "获得订阅信息失败, 刷新页面重试";
    GET_SERVER_SUCCESS = "获得订阅信息成功";

    TEST_FAIL    = "测试没结果!";
    TEST_SUCCESS = "已更新测试结果";
    TEST_WAIT    = "已经在测试中, 请稍等!";

    INPUT_NAME = "输入这个URL的命名";
}
