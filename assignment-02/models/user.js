let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeify = require('nodeify')

require('songbird')

let UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  blogTitle: String,
  blogDescription: String
})

UserSchema.methods.generateHash = async function(password) {
  return await bcrypt.promise.hash(password, 8)
}

UserSchema.methods.validatePassword = async function(password) {
  return await bcrypt.promise.compare(password, this.password)
}

UserSchema.pre('save', function(next) {
  var self = this
  nodeify(async () => {
    if (self.isModified('password')) {
      self.password = await self.generateHash(this.password)
    } else {
      return next()
    }
  }(), next)
})

UserSchema.path('password').validate((password) => {
  return password.length >= 4 &&
    (/[A-Z]/.test(password)) &&
    (/[a-z]/.test(password)) &&
    (/[0-9]/.test(password))
})

module.exports = mongoose.model('User', UserSchema)
