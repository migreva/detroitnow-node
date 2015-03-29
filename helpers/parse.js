module.exports = {
  isSectionPage: function(url) {
    return (url != "" &&
            url.indexOf('story/') === -1 &&
            url.indexOf('article/') === -1 &&
            url.indexOf('picture-gallery/') === -1 &&
            url.indexOf('longform/') === -1)
  }
};