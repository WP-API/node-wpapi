const unique = require( '../../../../lib/util/unique' );

describe( 'unique', () => {

	it( 'is a function', () => {
		expect( typeof unique ).toBe( 'function' );
	} );

	it( 'returns an array unchanged if there are no repeated items', () => {
		expect( unique( [ 1, 2, 3, 4 ] ) ).toEqual( [ 1, 2, 3, 4 ] );
		expect( unique( [ 'a', 'b', 'c' ] ) ).toEqual( [ 'a', 'b', 'c' ] );
		const obj1 = {};
		const obj2 = {};
		const obj3 = {};
		expect( unique( [ obj1, obj2, obj3 ] ) ).toEqual( [ obj1, obj2, obj3 ] );
	} );

	it( 'returns an array with duplicated items removed', () => {
		expect( unique( [ 1, 2, 3, 4, 1, 2 ] ) ).toEqual( [ 1, 2, 3, 4 ] );
		expect( unique( [ 'a', 'b', 'c', 'a', 'b' ] ) ).toEqual( [ 'a', 'b', 'c' ] );
		const obj1 = {};
		const obj2 = {};
		const obj3 = {};
		expect( unique( [ obj1, obj2, obj1, obj3, obj2 ] ) ).toEqual( [ obj1, obj2, obj3 ] );
	} );

} );
