This is a plugin for Vroom that allows using haml-js.

Here is the usage from the test app:

  var Vroom = require('../vroom/lib/vroom.js');
  var PathResource = require('../vroom/lib/vroom/path_resource.js');

  Vroom.installPlugin(require('vroom-haml.js'));

  var resource = new PathResource(function (r) {

    r.get('/', function () {
      this.foo = "bar";
      this.haml("test")
        .addErrback(function (err) {
          require('/utils.js').puts(err);
        });
    });

  });

  var app = new Vroom.Application();

  app.config.use(function (c) {
    c['logLevel'] = 'DEBUG';
    c['viewDir'] = node.path.dirname(__filename);
  });

  app.mount('root', '/', resource);
  app.boot();
  
