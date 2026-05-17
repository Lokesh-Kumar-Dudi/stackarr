/**
 * Widget Framework Core
 *
 * To create a new widget, add a JS file in modules/ and call:
 *
 *   Widget.register({
 *     id:       'my-widget',          // unique id (used for DOM)
 *     label:    'My Widget',          // display label (optional)
 *     refresh:  30000,                // auto-refresh ms (0 = no refresh)
 *     render:   (el) => { ... },      // build initial DOM inside el
 *     update:   async (el) => { ... } // fetch data & update el
 *   });
 *
 * Then include the script in index.html:
 *   <script src="modules/my-widget.js"></script>
 */

const Widget = (() => {
  const _widgets = [];

  function register(config) {
    if (!config.id) throw new Error('Widget must have an id');
    _widgets.push({
      id: config.id,
      label: config.label || config.id,
      refresh: config.refresh ?? 30000,
      render: config.render || (() => {}),
      update: config.update || (async () => {}),
    });
  }

  function _createContainer(w) {
    const el = document.createElement('div');
    el.className = 'widget';
    el.id = `widget-${w.id}`;
    return el;
  }

  async function mountAll() {
    const root = document.getElementById('widgets');
    if (!root) return;

    for (const w of _widgets) {
      const el = _createContainer(w);
      root.appendChild(el);

      // Let the widget build its DOM
      w.render(el);

      // Initial data fetch
      await w.update(el);

      // Schedule refresh
      if (w.refresh > 0) {
        setInterval(() => w.update(el), w.refresh);
      }
    }
  }

  return { register, mountAll };
})();

// Auto-mount after all scripts have loaded
window.addEventListener('DOMContentLoaded', () => Widget.mountAll());
