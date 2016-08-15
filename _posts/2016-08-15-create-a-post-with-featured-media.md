---
layout: post
title:  "Create a Post with Featured Media"
author: "K. Adam White"
author_web: https://bocoup.com/about/bocouper/kadam-white
date:   2016-08-15 15:34:00 -0400
categories: guides
---

In this guide we'll learn how to assign tags, categories and a featured image to a post.

First, let's connect to &amp; authenticate with our site. We'll use [HTTP basic authentication][basic-auth] for simplicity, but note the [usual caveats about security][basic-auth-warning] when using basic authentication.

(If you're writing your script for a browser-side WordPress plugin instead of a Node application, use the [client-side authentication process][client-auth-steps] instead and note the [client-side media handling differences](#client-side-media-handling) at the bottom of this page.)

Create the client instance we'll use to connect:

{% highlight javascript %}
var WPAPI = require( 'wpapi' );
var site = new WPAPI({
  endpoint: 'http://your-site.com/wp-json',
  username: 'yourusername',
  password: 'yourpassword'
});
{% endhighlight %}

Now we will learn how to assign tags, categories and featured media to a new post.

Tags and Categories are easy, because you can include an array of tag or categories to add when you create a post. Note however that you need to pass in the _IDs_ of the tags and the categories, not the slugs or any other information about them&mdash;slugs may be more convenient for us, but the REST API needs these numeric IDs to properly establish connections between WordPress data types.

Assuming you know the IDs of the categories you want to add&mdash;say, categories 7 and 42&mdash;and you want to add the tags with IDs 33, 71 and 193, you would list out those numbers in the call to `site.posts().create()`:

{% highlight javascript %}
site.posts().create({
  title: 'This post has media, tags & categories!',
  content: 'Excellent and compelling demonstration',
  categories: [ 7, 42 ],
  tags: [ 33, 71, 193 ]
}).then(function( post ) {
  console.log( 'Post created with ID # ' + post.id );
});
{% endhighlight %}

You'll notice that we haven't done anything about media yet. This is for a reason: media cannot be uploaded into a post before that post exists. If you think, &ldquo;but I can upload media when I'm creating a new post within the WordPress admin&rdquo;, what actually happens when you use the admin to create a new post is that WordPress automatically creates a post record (and saves it with the status "auto-draft") before you even start editing. This is the post record used to keep track of any media you upload before publishing or saving your new post.

Since we're creating this post through the API, we don't need to use "auto-draft"&mdash;but we _do_ need to create the post before we can upload any media to it, because the post will not have an ID until it has been created and WordPress needs that ID to be able to associate the post and its featured image.

In the example code above, you can see that once we've created the post WordPress has assigned it a unique ID (which we are logging out). Instead of that log statement, let's create and associate the image we want to upload:

{% highlight javascript %}
site.posts().create({
  title: 'This post has media, tags & categories!',
  content: 'Excellent and compelling demonstration',
  categories: [ 7, 42 ],
  tags: [ 33, 71, 193 ]
}).then(function( post ) {

  // Create the media record & upload your image file
  var filePath = '/path/to/the/image/to/upload.jpg';
  return wp.media().file( filePath ).create({
    title: 'Amazing featured image',
    // This property associates our new media record with our new post:
    post: post.id
  }).then(function( media ) {
    console.log( 'Media uploaded with ID #' + media.id );
  });

});
{% endhighlight %}

We've made two requests now: one to create our post, and another to create an associated media record. We need to make one final HTTP request in order to set the new media item as the featured media for the new post.

{% highlight javascript %}
site.posts().create({
  title: 'This post has media, tags & categories!',
  content: 'Excellent and compelling demonstration',
  categories: [ 7, 42 ],
  tags: [ 33, 71, 193 ]
}).then(function( post ) {
  // Create the media record & upload your image file
  var filePath = '/path/to/the/image/to/upload.jpg';
  return wp.media().file( filePath ).create({
    title: 'Amazing featured image',
    post: post.id
  }).then(function( media ) {

    // Set the new media record as the post's featured media
    return wp.posts().id( post.id ).update({
      featured_media: media.id
    });
  
  });
});
{% endhighlight %}

Now when you load or request that post, you should see that it has the correct tags, categories and featured media.

If you need to repeat this process many times in your application you could wrap the above code in a helper method that takes in the post object to create and the media to feature. So long as each nested promise is `return`ed properly, the helper can return a promise that will resolve when the whole process is complete.

## Client-Side Media Handling

Media can be uploaded from the browser as well, and almost all of the above process is the same in a browser application. The only difference is that instead of providing the file system path in the call to `.media().file()`, you would instead pass in a reference to an `<input type="file">` element's `.files` property:

{% highlight javascript %}
wp.media()
  .file( document.getElementById( 'file-input' ).files[0] )
  .create()...
{% endhighlight %}

[basic-auth]: https://github.com/WP-API/Basic-Auth
[basic-auth-warning]: http://wp-api.org/node-wpapi/authentication/#security-warning
[client-auth-steps]: {% post_url 2016-08-09-authenticating-with-cookies %}
