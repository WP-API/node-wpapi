/*global $:true*/

$(document).ready(function() {

	"use strict";

	$("body").addClassWhenItemAboveViewport("index-offscreen", ".index", -100);
	$(".main-header").addClassWhenItemAboveViewport("compact", "body", 20);

	
});