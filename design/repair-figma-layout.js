// Prepared for the next available official Figma use_figma call.
// fileKey: uhUIzH7EhksiA9hBtpfQg8
// skillNames: figma-use,figma-generate-design
// This file has not been applied: Figma Starter is currently rate-limited.
const routeNames = ['Главная', 'Как это работает', 'Вход', 'Регистрация', 'Кабинет', 'Заявка', 'Чат'];
const screens = figma.currentPage.children.filter(node => node.type === 'FRAME' && / \/ (Desktop|Mobile)/.test(node.name));
for (const id of ['4:2', '6:2', '8:2', '10:2', '12:2']) {
  if (await figma.getNodeByIdAsync(id)) $fig.get(id).remove();
}
let y = 150;
for (let row = 0; row < routeNames.length; row++) {
  const route = routeNames[row];
  const rowScreens = screens.filter(node => node.name.startsWith(route + ' /'));
  for (const screen of rowScreens) {
    const mobile = screen.name.includes('Mobile');
    const dark = screen.name.endsWith('Dark');
    const x = mobile ? (dark ? 4100 : 3400) : (dark ? 1700 : 0);
    const label = `${String(row + 1).padStart(2, '0')} · ${route} · ${mobile ? 'Телефон 390' : 'Компьютер 1440'} · ${dark ? 'Тёмная' : 'Светлая'}`;
    $fig.get(screen.id).set({ x, y, name: label, clipsContent: true, layoutSizingHorizontal: 'FIXED', layoutSizingVertical: 'FIXED' });
    $fig.text({ name: 'Подпись · ' + label, characters: label, x, y: y - 65,
      fontName: { family: 'IBM Plex Mono', style: 'Regular' }, fontSize: mobile ? 13 : 18,
      width: mobile ? 390 : 1440, fills: [figma.util.solidPaint('#103dff')] });
  }
  y += Math.max(...rowScreens.map(node => node.height)) + 230;
}
await $fig.done();
return { arrangedScreens: screens.length, labels: screens.length };
