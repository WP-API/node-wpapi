'use strict';

const noop = () => {};

class MockAgent {
	get() {
		return this;
	}

	post() {
		return this;
	}

	put() {
		return this;
	}

	del() {
		return this;
	}

	head() {
		return this;
	}

	send( data ) {
		this._data = data;
		return this;
	}

	auth() {
		return this;
	}

	end( cb ) {
		cb = cb || noop;
		cb( this._err || null, this._response || {} );
	}
}

module.exports = MockAgent;
