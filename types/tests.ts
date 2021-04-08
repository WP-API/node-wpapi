import * as WPAPI from "wpapi";

const instance = new WPAPI(''); // $ExpectType WPAPI

instance.auth(); // $ExpectError
