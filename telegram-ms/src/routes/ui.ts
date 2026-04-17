import { Hono } from 'hono';
import { Environment } from '../types';
import { html as announcement_sender_html} from '../utils/announcement-sender';

const ui = new Hono<{ Bindings: Environment }>();

ui.get('/announcement-sender', async (c) => {
  return c.html(announcement_sender_html);
});

export default ui;