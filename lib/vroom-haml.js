var Haml = require('../haml-js/haml.js');

exports.install = function install(Vroom) {
  Vroom.Config.addOption('viewDir', "The directory views are served from.", ['{String}']);
  Vroom.Config.addOption('reloadTemplates', "Reload templates on each request, great for development.", ['false', 'true']);
  
  Vroom.Request.prototype.haml = function (name, opts) {
    opts = opts || {};
    var promise = new node.Promise();
    var renderPromise = new node.Promise();
    var r = this;
    var config = this.application.config;
    
    if (/^\//.exec(config.viewDir)) {
      var path = node.path.join(config.viewDir, name + ".html.haml");
    } else {
      var path = node.path.join(config.root, (config.viewDir || "."), name + ".html.haml");
    }
    this.application.LOG.debug("Using template: " + path);
    
    renderPromise
      .addCallback(function (tmpl) {
        r.status = r.status || 200;
        
        if (opts.autoFinish !== false)
          r.addHeader('Content-Length', tmpl.length);
        
        r.addHeader('Content-Type', 'text/html');
        r.sendHeader();
        r.write(tmpl);
        
        if (opts.autoFinish !== false)
          r.finish();
        
        promise.emitSuccess(tmpl);
      })
      .addErrback(function (err) {
        promise.emitError(err);
      });
    
    render(renderPromise, path, this, {reload: config.reloadTemplates});
    
    return promise;
  };
  
  var cache = {};
  
  function compile(path) {
    var promise = new node.Promise();
    
    node.fs.cat(path, 'binary')
      .addCallback(function (contents) {
        var tmpl = function (scope) {
          var json = Haml.parse.call(scope, contents);
          return Haml.to_html(json).replace("\n\n", "\n")
        };
        cache[path] = tmpl;
        promise.emitSuccess(tmpl);
      })
      .addErrback(function () {
        promise.emitError("File " + path + " was unreadable.");
      });
    
    return promise;
  }
  
  function render(promise, path, data, opts) {
    opts = opts || {};
    if (cache[path] && opts.reload !== true) {
      promise.emitSuccess(cache[path](data));
    } else {
      compile(path)
        .addCallback(function (tmpl) {
          promise.emitSuccess(cache[path](data));
        })
        .addErrback(function (err) {
          promise.emitError(err);
        });
    }
  }
}