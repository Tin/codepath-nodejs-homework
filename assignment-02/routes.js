let isLoggedIn = require('./middleware/isLoggedIn')
let multiparty = require('multiparty')
let then = require('express-then')
let User = require('./models/user')
let Post = require('./models/post')
let Comment = require('./models/comment')
let DataUri = require('datauri')
let fs = require('fs')
let ObjectId = require('mongoose').Types.ObjectId;

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

  app.get('/blog/:username', then(async (req, res) => {
    let username = req.params.username
    let user = await User.findOne({username})
    if (!user) {
      res.send(404, `Blog for %{user} Not found`)
    } else {
      res.render('blog.ejs', { user, req })
    }
  }))

  app.post('/posts/:postId/comments', then(async (req, res) => {
    let postId = req.params.postId
    let postPage = req.headers['referer']
    let user = await User.promise.findOne({'posts._id': new ObjectId(postId)})
    if (!user) {
      res.send(404, `Blog post with id %{postId} is not found`)
    }
    let post = user.posts.filter((post) => {
      console.log(post._id, postId)
      return '' + post._id === postId
    })[0]
    console.log('post', post)
    let commentContent = req.body.comment
    let comment = new Comment()
    comment.comment = commentContent
    post.comments.push(comment)
    await comment.save()
    await user.save()
    res.redirect(postPage)
  }))

  app.get('/posts/:postId?', isLoggedIn, then(async (req, res) => {
    let postId = req.params.postId
    if (!postId) {
      res.render('post.ejs', {
        post: {},
        user: req.user,
        verb: 'Create'
      })
    } else {
      let post = await Post.promise.findById(postId)
      if (!post) {
        res.send(404, 'Not found')
      }
      let dataUri = new DataUri
      let image = post.image ? dataUri.format('.' + post.image.contentType.split('/').pop(), post.image.data) : ''

      res.render('post.ejs', {
        post: post,
        user: req.user,
        verb: 'Update',
        image:  `data:${post.image.contentType};base64,${image.base64}`
      })
    }
  }))

  app.post('/posts/:postId?', isLoggedIn, then(async (req, res) => {
    let postId = req.params.postId
    let [{ title: [title], content: [content]},{ image: [file] }] = await new multiparty.Form().promise.parse(req)
    let post, isNew = false

    if (!postId) {
      post = new Post()
      isNew = true
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
    if (isNew) {
      req.user.posts.push(post)
      await req.user.save()
    }
    res.redirect('/posts/' + post._id)
    return
  }))
}
