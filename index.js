var Beam = require('beam-client-node');
var Tetris = require('beam-interactive-node');
const Packets = require('beam-interactive-node/dist/robot/packets').default;
var OWIRobotArm = require('owi-robot-arm');

var arm = new OWIRobotArm();

var username = 'ProbablePrime';
var password = 'password';
var channelID;
var beam = new Beam();
function getChannelID(channelName) {
	//i got lazy here and hardcoded some stuff
	return beam.request('GET', `channels/probableprime`).then(res => {
		channelID = res.body.id;
		return res.body.id;
	});
}
beam.use('password', {
    username: username,
    password: password
}).attempt()
.then(getChannelID(username))
.then(function(){
	return beam.request('PUT', `channels/${channelID}`, {body: {
		interactive: true,
		tetrisGameId: 2553
	}, json: true});
})
.then(function () {
    return beam.game.join(channelID);
})
.then(function (res) {
    var details = {
        remote: res.body.address,
        channel: channelID,
        key: res.body.key
    };
    var robot = new Tetris.Robot(details);
    robot.handshake(function (err) {
			console.log('goooo');
        if (err) throw new Error('Error connecting to Tetris', err);
    });

    robot.on('report', function (report) {
			if(report.tactile) {
        tactileUpdates = report.tactile.map(handleTactile);
			}
			var progress = {
				tactile:tactileUpdates,
				joystick:[]
			}
			robot.send(new Packets.ProgressUpdate(progress));
    });
}).catch(e=> {
	console.log(e);
});
var disabledControls = '89';
function handleTactile(tactile) {
	fired = false;
	disabled = (disabledControls.search(tactile.id) !== -1) ? true : false;
	if(tactile.pressFrequency > 0) {
		doTactile(tactile.id);
		fired = true;
	}
	return new Packets.ProgressUpdate.TactileUpdate({
		id: tactile.id,
		cooldown: 0,
		fired: fired,
		progress: 0,
		disabled: disabled
	});
}
var map = {
	0:'baseCounterClockwise',
	1:'baseClockwise',
	2:'shoulderUp',
	3:'shoulderDown',
	4:'elbowUp',
	5:'elbowDown',
	6:'wristUp',
	7:'wristDown',
	8:'gripsOpen',
	9:'gripsClose',
	10:'ledOn',
	11:'ledOff',
}
function doTactile(id) {
	var func = map[id];
	arm[func]();
	setTimeout(()=> {
		arm.stop();
	},600);
}
