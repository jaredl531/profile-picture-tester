# Should I make this my profile picture?
A fun UI that uses Clarifai's General, NSFW, Celebrity and Focus Models to determine if a picture is worthy of being used on a Social Media profile. 

A live demo can be viewed [here](https://jared-hack-projects.s3.us-east-2.amazonaws.com/profile-picture-tester/index.html).

## How to get started

The tester uses the Clarifai API, so you'll need to grab an API Key by [signing up](https://portal.clarifai.com/signup) and then clicking on your default application. You'll then want to add it to the keys.js file:

```
var myApiKey = 'YOUR API KEY HERE';
```

One this is done you should be able to run this locally! 

## What Gets Measured

The following criteria are used to determine if something is "good enough" to be a profile picture.

### Authenticity

The tool will mark this as OK if it finds:

1. One non-celebrity face (and one only)
2. A picture that isn't <i>just</i> celebrities, and
3. The absence of text

Any of these can trigger a big red X if they fail.

### Appropriateness

The tool will mark this as OK if it finds:

4. An NSFW score of less than 80%, and
5. No nudity (including torsos. keep those shirts on folks!)

### Clarity

The tool will also look for a focus score of at least 70% to ensure that the picture is clear and high-resolution enough for profile greatness.

## Examples

Just a Celebrity

<img src="https://jared-hack-projects.s3.us-east-2.amazonaws.com/profile-picture-tester/examples/bieber.png"/>

Not a Human

<img src="https://jared-hack-projects.s3.us-east-2.amazonaws.com/profile-picture-tester/examples/pug.png"/>

Mine!

<img src="https://jared-hack-projects.s3.us-east-2.amazonaws.com/profile-picture-tester/examples/me.png"/>

And all this time...I thought it was crisp!
