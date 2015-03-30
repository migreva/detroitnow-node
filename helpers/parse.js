module.exports = {
  isSectionPage: function(url) {
    return (url != "" &&
            url.indexOf('story/') === -1 &&
            url.indexOf('article/') === -1 &&
            url.indexOf('picture-gallery/') === -1 &&
            url.indexOf('longform/') === -1)
  },
  toTitleCase: function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }
};