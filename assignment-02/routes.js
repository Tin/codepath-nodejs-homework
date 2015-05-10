let isLoggedIn = require('./middleware/isLoggedIn')
let multiparty = require('multiparty')
let then = require('express-then')
let Post = require('./models/post')
let DataUri = require('datauri')
let fs = require('fs')

module.exports = (app) => {
  let passport = app.passport

  app.get('/', (req, res) => {
    res.render('index.ejs', {message: req.flash('error')})
  })

  app.get('/login', (req, res) => {
    res.render('login.ejs', {message: req.flash('error')})
  })

  app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login',
    failureFlash: true
  }))

  app.get('/signup', (req, res) => {
    res.render('signup.ejs', {message: req.flash('error')})
  })

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/signup',
    failureFlash: true
  }))

  app.get('/profile', isLoggedIn, (req, res) => {
    res.render('profile.ejs', {
      user: req.user,
      message: req.flash('error')
    })
  })

  app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
  })

  app.get('/posts/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    if (!postId) {
      res.render('post.ejs', {
        post: {},
        verb: 'Create'
      })
    } else {
      let post = await Post.promise.findById(postId)
      if (!post) {
        res.send(404, 'Not found')
      }
      let dataUri = new DataUri
      let image = dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
      res.render('post.ejs', {
        post: post,
        verb: 'Update',
        image:  `data:${post.image.contentType};base64,${image.base64}`
      })
    }
  }))

  app.post('/posts/:postId?', then(async (req, res) => {
    let postId = req.params.postId
    let [{ title: [title], content: [content]},{ image: [file] }] = await new multiparty.Form().promise.parse(req)
    let post

    if (!postId) {
      post = new Post()
    } else {
      post = await Post.promise.findById(postId)
      if (!post) {
        res.send(404, 'Not found')
      }
    }

    post.title = title

    post.content = content
    if (file.size > 0) {
      console.log(file)
      post.image.data = await fs.promise.readFile(file.path)
      post.image.contentType = file.headers['content-type']
    }
    await post.save()
    res.redirect('/posts/' + post._id)
    return
  }))
}
