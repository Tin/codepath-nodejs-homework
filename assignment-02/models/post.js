let mongoose = require('mongoose')
let marked = require('marked')
require('songbird')

let PostSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  image: {
    data: Buffer,
    contentType: String
  }
})

PostSchema.methods.renderedContent = function() {
  return marked(this.content)
}

module.exports = mongoose.model('Post', PostSchema)
