let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/user')
let util = require('util')

module.exports = (app) => {
  let passport = app.passport

  passport.use(new LocalStrategy({
    usernameField: 'username',
    failureFlash: true
  }, nodeifyit(async (username, password) => {
    let user
    if (username.indexOf('@') > -1) {
      user = await User.promise.findOne({
        email: username.toLowerCase()
      })
    } else {
      user = await User.promise.findOne({
        'username' : {
          $regex:  new RegExp(username, 'i')
        }
      })
    }
    

    if (!user || username !== user.username) {
      return [false, {message: 'Invalid username'}]
    }

    if (!await user.validatePassword(password)) {
      return [false, {message: 'Invalid password'}]
    }
    return user
  }, {spread: true})))

  passport.serializeUser(nodeifyit(async (user) => user._id))
  passport.deserializeUser(nodeifyit(async (id) => {
    return await User.promise.findById(id)
  }))

  passport.use('local-signup', new LocalStrategy({
    // Use "email" field instead of "username"
    usernameField: 'username',
    failureFlash: true,
    passReqToCallback: true
  }, nodeifyit(async (req) => {
    let {username, title, description, email, password} = req.body
    email = (email || '').toLowerCase()
    // Is the email taken?
    if (await User.promise.findOne({email})) {
      return [false, {message: 'That email is already taken.'}]
    }

    

    let query = {
      'username' : {
        $regex:  new RegExp(username, 'i')
      }
    }

    if (await User.promise.findOne(query)) {
      return [false, {message: 'That username is already taken.'}]
    }

    // create the user
    let user = new User()
    user.email = email
    user.username = username
    user.password = password
    user.blogTitle = title
    user.blogDescription = description

    try {
      return await user.save()
    } catch(e) {
      console.log(util.inspect(e))
      return [false, {
        message: util.inspect(e)
      }]
    }
  }, {spread: true})))
}
