var roomID;
var peer;

var nickname = "no name";
createNewPeer();

function startID() {
    if (peer) {
        peer.destroy();
    } else {
        createNewPeer();
    }

}

function joinRoom() {
    roomID = $("#peer-id").val();
    createConnection(roomID);
}

function createMsg(input, type, name = "System", time = returnTimeNow()) {
    $("#msgbox").append(`<span class="${type} message">${input}</span><div class="${type} info">${name}<br>${convertTime(time)}(${returnTimeNow() - time}ms)</div>`)
    $('#msgbox').animate({
        scrollTop: $('#msgbox')[0].scrollHeight
    }, "slow");
}

$(document).ready(function () {
    $("#input").keypress(function (e) {
        code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            createMsg($("#input").val(), "self", "You", returnTimeNow())
            conn.send(createMsgPackage($("#input").val(), nickname, returnTimeNow()));
            $("#input").val("");

        }

    })
    $("#nickname").change(function () {
        var nickmsg = createMsgPackage(`User "${nickname}" has change their nickname to "${$("#nickname").val()}"`, "System");
        conn.send(nickmsg);
        nickname = $("#nickname").val();
    }
    )
});

function createNewPeer() {
    peer = new Peer({
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },
                { url: 'stun:stun1.l.google.com:19302' },
                { url: 'stun:stun2.l.google.com:19302' },
                { url: 'stun:stun3.l.google.com:19302' },
                { url: 'stun:stun4.l.google.com:19302' },
                {
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
                {
                    url: 'turn:192.158.29.39:3478?transport=udp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
                {
                    url: 'turn:192.158.29.39:3478?transport=tcp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
                {
                    url: 'turn:turn.bistri.com:80',
                    credential: 'homeo',
                    username: 'homeo'
                },
                {
                    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                }

            ]
        }
    });
    peer.on('open', function (roomID) {
        console.log('My peer ID is: ' + roomID);
        $("#your-id").html(roomID);
        createMsg(`Your ID: ${roomID}`);
    });

    peer.on('close', function () {
        createMsg(`Room Disconnected`);
        $("#your-id").html("Not connected yet");
    });
    peer.on('connection', function (newConn) {
        createMsg(`User Connected: ${newConn.peer}`);
        newConn.on("data", function (msg) {
            createMsg(msg.msg, "other", msg.nickname, msg.sentTime);
        });
        var video = document.createElement("video");
        document.body.append(video);
        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        getUserMedia({ video: true, audio: true }, function (stream) {
            var call = peer.call(newConn.peer, stream);
            call.on('stream', function (remoteStream) {
                // Show stream in some video/canvas element.
                console.log(remoteStream);
                video.srcObject = remoteStream;
                video.onloadedmetadata = function (e) {
                    video.play();
                };
            });
        }, function (err) {
            console.log('Failed to get local stream', err);
        });

        conn = newConn;
        console.log(newConn)
    });
    peer.on('error', function (err) {
        createMsg(err);
        console.log(err);
    })
}
//others
function createConnection(roomID) {
    conn = peer.connect(roomID);
    conn.on('open', function () {

        var video = document.createElement("video");
        document.body.append(video);
        // Receive messages
        conn.on('data', function (data) {
            console.log('Received', data);
        });

        // Send messages
        createMsg(`Room Connected:` + roomID);

        var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        peer.on('call', function (call) {
            getUserMedia({ video: true, audio: true }, function (stream) {
                call.answer(stream); // Answer the call with an A/V stream.
                call.on('stream', function (remoteStream) {
                    // Show stream in some video/canvas element.
                    console.log(remoteStream);
                    video.srcObject = remoteStream;
                    video.onloadedmetadata = function (e) {
                        video.play();
                    };
                });
            }, function (err) {
                console.log('Failed to get local stream', err);
            });
        });

    });
    conn.on('data', function (msg) {
        createMsg(msg.msg, "other", msg.nickname, msg.sentTime);
        console.log(msg);
    });
    conn.on('close', function () {
        createMsg(`User Disconnected`);
        $("#your-id").html("Not connected yet");
    });
}

function createMsgPackage(msgCnt, nickname, sentTime = returnTimeNow()) {
    return {
        msg: msgCnt,
        nickname: nickname,
        sentTime: sentTime
    };
}
function returnTimeNow() {
    var date = new Date();
    return date.getTime();
}

function convertTime(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp);
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = hour + ':' + min + ':' + sec;
    return time;
}
