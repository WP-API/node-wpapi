const sinon = require( 'sinon' );

var MockAgent = function() {};

MockAgent.prototype = {
	get: function() { return this; },
	post: function() { return this; },
	put: function() { return this; },
	del: function() { return this; },
	head: function() { return this; },
	send: function() { return this; },
	set: function() { return this; },
	end: function() { return this; }
};

sinon.stub( MockAgent.prototype );

module.exports = MockAgent;
