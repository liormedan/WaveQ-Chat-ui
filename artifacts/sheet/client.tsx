export const sheetArtifact = {
  type: 'sheet',
  kind: 'sheet',
  name: 'Sheet',
  component: () => <div>Sheet artifact placeholder</div>,
  actions: [
    {
      description: 'Export sheet',
      icon: 'export',
      label: 'Export',
      handler: () => console.log('Export sheet'),
      onClick: () => console.log('Export sheet'),
    }
  ],
};