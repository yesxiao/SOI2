/**
 * Created by 杜鹏宇 on 2015/7/23
 * Modified by
 */

//通信支持
CommControl = function () {
    this.socket = null;//通信实体
}
//建立与服务器的通信
CommControl.prototype.run = function (call) {
    //连接websocket后端服务器
    try {
        this.socket = io.connect(server);//server是服务器地址，如http://172.22.227.46:8000
    }
    catch (e) {
        alert('管理员打扫战场中，请等待战场开启');
        window.location.href = 'ready.html';
    }

    //监听新用户登录
    this.socket.on('login', function (o) {
            console.log('玩家' + o.clientId + '加入战场');
            //检测到自己登陆成功
            if (game.userCamp == null) {
                if (o.onlineCount % 2 == 1) {
                    game.userCamp = 'R';
                } else {
                    game.userCamp = 'B';
                }
                call();
            } else {
                if (o.onlineCount % 2 == 1) {
                    o.camp = 'R';
                } else {
                    o.camp = 'B';
                }
                if (o.camp == game.userCamp) {
                    game.infoControl.friendJoin();
                } else {
                    game.infoControl.enemyJoin();
                }
            }
        }
    );

    //告诉服务器端有用户登录
    this.socket.emit('login', {clientId: game.userName, camp: game.userCamp});

    //监听用户退出
    this.socket.on('logout', function (o) {
        console.log('玩家' + o.clientId + '离开战场');
    });

    //监听消息发送
    this.socket.on('message', function (obj) {
        if (obj.command == 'gameOver') {
            game.gameover(obj.data);
        }
        if (!game.isHost && obj.from == 'Server') {
            if (obj.command == 'updateTank') {
                game.tankControl.clientUpdate(obj.data, game.scene);
            }
            if (obj.command == 'updateShell') {
                game.shellControl.clientUpdate(obj.data);
            }
        }
        if (game.isHost && obj.to == 'Server') {
            if (obj.command == 'newTank') {
                var md = obj.data;
                game.tankControl.addTank(md.user, md.camp, md.position, md.type, game.scene);
                console.log('服务器为新玩家' + md.user + '创建坦克');
            }
            if (obj.command == 'sendTankInfo') {
                game.tankControl.updateTankInfo(obj.from, obj.data);
            }
            if (obj.command == 'newShell') {
                var md = obj.data;
                game.shellControl.addShell(md.position, md.direction, md.speed, md.damage, game.scene);
            }
        }
    });
}
//发送消息
CommControl.prototype.send = function (to, from, com, data) {
    var obj = {
        to: to,
        from: from,
        command: com,
        data: data
    };
    this.socket.emit('message', obj);
}