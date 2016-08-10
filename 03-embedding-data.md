---
layout: page
title: Embedding Data
permalink: /embedding-data/
---

_**Note:** This section applies only to the WP-API v2 betas and above; the initial 1.0 release of the API embedded data by default._

Data types in WordPress are interrelated: A post has an author, some number of tags, some number of categories, *etc*. By default, the API responses will provide pointers to these related objects, but will not embed the full resources: so, for example, the `"author"` property would come back as just the author's ID, *e.g.* `"author": 4`.

This functionality provides API consumers the flexibility to determine when and how they retrieve the related data. However, there are also times where an API consumer will want to get the most data in the fewest number of responses. Certain resources (author, comments, tags, and categories, to name a few) support *embedding*, meaning that they can be included in the response if the `_embed` query parameter is set.

To request that the API respond with embedded data, simply call `.embed()` as part of the request chain:

`wp.posts().id( 2501 ).embed()`...

This will include an `._embedded` object in the response JSON, which contains all of those embeddable objects:

```js
{
    "_embedded": {
        "author": [ /* ... */ ],
        "replies": [ /* ... */ ],
        "http://v2.wp-api.org/attachment": [ /* ... */ ],
        "http://v2.wp-api.org/term": [
            [ {}, {} /* category terms */ ],
            [ {} /* tag terms */ ],
            /* etc... */
        ],
        "http://v2.wp-api.org/meta": [ /* ... */ ]
    }
}
```

For more on working with embedded data, [check out the WP-API documentation](http://v2.wp-api.org/).