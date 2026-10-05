/** Progressive enhancement for newsletter / waitlist forms: submit with fetch and show the reply inline. */
function bind() {
  document.querySelectorAll<HTMLFormElement>('[data-newsletter]').forEach((form) => {
    if (form.dataset.bound) return;
    form.dataset.bound = '1';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = form.querySelector<HTMLElement>('[data-msg]');
      const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (btn) btn.disabled = true;
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { accept: 'application/json' } });
        const body = (await res.json()) as { message: string };
        if (msg) msg.textContent = body.message;
        if (res.ok) form.reset();
      } catch {
        if (msg) msg.textContent = 'Something went wrong. Please try again.';
      } finally {
        if (btn) btn.disabled = false;
      }
    });
  });
}
document.addEventListener('astro:page-load', bind);
if (document.readyState !== 'loading') bind();
else document.addEventListener('DOMContentLoaded', bind);
