
// module.exports = function(app) {
//   app.io.route('/', function(req, res, next) {
//     res.render('index', { title: 'Express' });
//   });

//   app.io.route('ready', function(req) {
//     req.session.name = req.data
//     req.session.save(function() {
//         req.io.emit('get-feelings')
//     })
//   })
// };
