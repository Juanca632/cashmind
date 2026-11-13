/** @jest-environment node */
import { ESLint } from 'eslint';

// Loaded directly: ESLint's own config loader needs dynamic import, which Jest does not allow.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projectConfig = require('../../eslint.config.js');

const FILE = 'src/features/x/screens/sample-screen.tsx';
const wrap = (style: string) =>
  `import { StyleSheet } from 'react-native';\nimport { Layout, Spacing } from '@/shared/theme/theme';\nvoid Spacing; void Layout;\nexport const styles = StyleSheet.create({ box: { ${style} } });\n`;

async function lint(style: string) {
  const eslint = new ESLint({ cwd: process.cwd(), overrideConfigFile: true, overrideConfig: projectConfig });
  const [result] = await eslint.lintText(wrap(style), { filePath: FILE });
  return result.messages.filter((m) => m.severity === 2);
}

describe('Styles change in one place', () => {
  it('Guard: a plain number for padding is reported', async () => {
    expect((await lint('padding: 12')).length).toBeGreaterThan(0);
  }, 60000);

  it('Guard: adding spacing values together for a gap is reported', async () => {
    expect((await lint('gap: Spacing.two + Spacing.one')).length).toBeGreaterThan(0);
  }, 60000);

  it('Guard: using Spacing directly in a screen is reported', async () => {
    expect((await lint('padding: Spacing.three')).length).toBeGreaterThan(0);
  }, 60000);

  it('Guard: a plain number for minHeight is reported', async () => {
    expect((await lint('minHeight: 40')).length).toBeGreaterThan(0);
  }, 60000);

  it('Guard: a shared Layout value is accepted', async () => {
    expect(await lint('padding: Layout.screenPadding')).toEqual([]);
  }, 60000);
});
