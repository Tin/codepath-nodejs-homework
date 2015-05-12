let mongoose = require('mongoose')
let marked = require('marked')
require('songbird')

let CommentSchema = mongoose.Schema({
  comment: {
    type: String,
    required: true
  }
})

CommentSchema.methods.renderedContent = function() {
  return marked(this.comment)
}

module.exports = mongoose.model('Comment', CommentSchema)
