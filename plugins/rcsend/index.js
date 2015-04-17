if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define(['child_process'], function(childproc) {

  //Tristate codes:
  /*10001
A 0FFF0 0FFFF 0F	0FFF0 0FFFF F0
B 0FFF0 F0FFF 0F	0FFF0 F0FFF F0
C 0FFF0 FF0FF 0F	0FFF0 FF0FF F0
D 0FFF0 FFF0F 0F	0FFF0 FF0FF F0*/

  var _rcsend = "sudo ./plugins/rcsend/rcswitch-pi/sendTriState ";
  var _irsend = "irsend send_once Philips ";
  
  var exec = childproc.exec;
  /**
   * RCSend Plugin. Can access the rcsend-pi on the Raspberry PI
   *
   * @class RCSend
   * @param {Object} app The express application
   * @constructor 
   */
  var RCSend = function(app) {
	
    this.name = 'RCSend';
    this.collection = 'RCSend';
    this.icon = 'icon-lightbulb';
	
    this.app = app;
    this.id = this.name.toLowerCase();
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

    var that = this;

    // Ping interval
    setInterval(function() {
      that.parse();
    }, 100);

    app.get('sockets').on('connection', function(socket) {
      // GPIO toggle
      socket.on('rc-send', function(command) {
      	console.log('rc-send command:');
      	console.log(command);
        that.send(command);
      });

    });
  };

  /**
   * Send a RC command
   * 
   * @method send
   * @param {Object} data The websocket data
   * @param {String} data.id The ID of the database entry
   * @param {String} data.value The value to set
   */
  RCSend.prototype.send = function(data) {
    var that = this;
    this.pluginHelper.findItem(this.collection, data.id, function(err, item, collection) {
      var command = item.type == "ir" ? _irsend : _rcsend;
      console.log("Working dir: " + process.cwd());
      console.log('sending via ' + item.type);
      console.log('command: ' + command + item.value);
      exec(command + item.value, function (error, stdout, stderr) {
    	console.log('stdout: ' + stdout);
    	console.log('stderr: ' + stderr);
    	if (error !== null) {
      		console.log('exec error: ' + error);
      		}
    	});
    });
  };

  /**
   * Parse RCSend commands that are used as input and send the result to the client websocket
   * 
   * @method parse
   */
  RCSend.prototype.parse = function() {
    var that = this;
    if (that.app.get('clients').length > 0) {
      that.app.get('db').collection(this.collection, function(err, collection) {
        collection.find().toArray(function(err, result) {
          result.forEach(function(item) {            
	          that.app.get('sockets').emit('rcsend-command', {
	            id: item._id,
	            value: item.command
	          });	          
           });   
        });
      });
    }
  };

  /**
   * Manipulate the items array before render
   *
   * @method beforeRender
   * @param {Array} items An array containing the items to be rendered
   * @param {Function} callback The callback method to execute after manipulation
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result The manipulated items
   */
  RCSend.prototype.beforeRender = function(items, callback) {
    var that = this;    
    return callback(null, items);
  };

  /**
   * API functions of the RCSend Plugin
   * 
   * @method api
   * @param {Object} req The request
   * @param {Object} res The response
   */

  RCSend.prototype.api = function(req, res, next) {
    /*
     * GET
     */
    /*if (req.method == 'GET') {
      var that = this;
      this.app.get('db').collection(this.collection, function(err, collection) {
      	
        collection.find({}).toArray(function(err, items) {
          if (!err) {
            that.beforeRender(items, function() {
              res.send(200, items);
            });
          } else {
            res.send(500, '[]');
          }
        });
      });
    } else {
      next();
    }*/
  };

  var exports = RCSend;

  return exports;

});

	