var MockAgent = function() {};

function noop() {}

MockAgent.prototype = {
	get: function() { return this; },
	post: function() { return this; },
	put: function() { return this; },
	del: function() { return this; },
	head: function() { return this; },
	send: function( data ) {
		this._data = data;
		return this;
	},
	set: function() { return this; },
	end: function( cb ) {
		cb = cb || noop;
		cb( null, this._response || {} );
	}
};

module.exports = MockAgent;
