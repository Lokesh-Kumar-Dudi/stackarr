/**
 * VPN Status Widget
 * Shows the current public IP and country from Gluetun.
 */
Widget.register({
  id: 'vpn',
  label: 'VPN',
  refresh: 30000,

  render(el) {
    el.innerHTML = `
      <div class="widget-ip loading" data-ref="ip">...</div>
      <div class="widget-sub" data-ref="location"></div>
    `;
  },

  async update(el) {
    const ip = el.querySelector('[data-ref="ip"]');
    const loc = el.querySelector('[data-ref="location"]');
    ip.classList.add('loading');

    try {
      const res = await fetch('/api/publicip');
      const data = await res.json();
      ip.textContent = data.public_ip || 'Unknown IP';
      loc.textContent = data.country || '';
    } catch {
      ip.textContent = 'Offline';
      loc.textContent = 'Cannot reach Gluetun';
    }

    ip.classList.remove('loading');
  },
});
