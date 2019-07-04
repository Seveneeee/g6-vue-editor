this.Interval_Report = 5*1000;
this.Timeing = function () {
    if (this.IsInLearning == 0) return; //若学习状态为0，直接返回
    this.learnedTime = 7200;
    if (this.needLearnTime <= this.learnedTime)  //判断学习时间是否已满足，若满足，停止计时
    {
        this.StopOnTimeOver(); //停止计时
        return;
    }
    var myNowTime = new Date(); //当前时间

    this.ShowLearnMsg(); //刷新显示学习信息

    //如果上次报告已达到报告的时间间隔，报告服务器
    if (Math.floor(myNowTime.getTime() - this.LastTime_Report.getTime()) >= this.Interval_Report * 1000) {
        this.Report();
    }
    //如果上次验证已达到验证的时间间隔，发起验证
    // if (Math.floor((myNowTime.getTime() - this.LastTime_Verify.getTime()) / 1000 ) >= this.Interval_Verify) {
    //     if (this.IsVerifying == 0) {
    //         //未在验证中，发起验证
    //         this.Verify();
    //         this.IsVerifying = 1;
    //         this.VerifyStartTime = myNowTime; //设置验证起始时间
    //     }
    //     else {
    //         //刷新验证时间

    //         //判断验证是否超时
    //         if (Math.floor((myNowTime.getTime() - this.VerifyStartTime.getTime()) / 1000) >= this.VerifingTime) {
    //             //验证超时
    //             //this.Stop(); //停止学习计时
    //             //$("#" + this.VerifyDailogDivId).hide(); //隐藏验证窗体
    //             //this.IsVerifying = 0; //设置验证状态为关闭
    //             //alert("填写验证码超时，学习停止！");
    //             //return; //直接返回，不再刷新计时信息
    //         }
    //     }
    // }
    var myThis = this; //传递this到下级内部创建的函数
    setTimeout(function () { myThis.Timeing(); }, 1000); //1秒后启动定时处理程序（设置释放的钩子）
}

this.StopOnTimeOver = function () {
    if (this.IsInLearning == 0) return; //若当前学习为停止状态，直接返回
    var myUrlStr = this.UrlStr_Root + this.UrlStr_Stop;
    this.IsInLearning = 0; //将学习状态置为0
    var myThis = this; //传递this到内部创建的函数
    $.ajax({
        url: myUrlStr,
        dataType: "json",
        type: 'POST',
        cache: false,
        async: false,
        data: { inClassId: myThis.ThisClassId, inCourseId: myThis.ThisCourseId, inLessonId: myThis.ThisLessonId },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            alert("学习时间已满，自动停止学习计时发生错误，连接计时服务器失败，错误信息：" + errorThrown);
        },
        success: function (data) {
            alert("学习时间已满，学习计时自动停止！");
        }
    });
}

this.Report = function () {
    if (this.IsInLearning == 0) return; //若学习状态为0，直接返回
    var myUrlStr = this.UrlStr_Root + this.UrlStr_Report;
    var myThis = this; //传递this到内部创建的函数
    var myDate = new Date();
    $.ajax({
        url: myUrlStr,
        dataType: "json",
        type: 'POST',
        cache: false,
        async: true,
        data: { inClassId: myThis.ThisClassId, inCourseId: myThis.ThisCourseId, inLessonId: myThis.ThisLessonId },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            //alert("发送学习计时报告信息发生错误，连接计时服务器失败，错误信息：" + errorThrown);
        },
        success: function (data) {
            if (data.Value < 0) {
                //错误，停止学习
                myThis.IsInLearning = 0; //将学习状态置为0（控制学习报告和验证不执行）
                alert("学习报告失败，原因：" + data.Message);
            }
            else {
                //计算已学习时间
                myThis.learnedTime = myThis.learnedTime + Math.floor((myDate.getTime() - myThis.LastTime_Report.getTime()) / 1000)
                //记录本次报告时间
                myThis.LastTime_Report = myDate;

                myThis.ShowLearnMsg(); //刷新显示学习信息

            }
        }
    });
}