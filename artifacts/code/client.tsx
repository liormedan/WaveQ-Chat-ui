export const codeArtifact = {
  type: 'code',
  kind: 'code',
  name: 'Code',
  component: () => <div>Code artifact placeholder</div>,
  actions: [
    {
      description: 'Copy code',
      icon: 'copy',
      label: 'Copy',
      handler: () => console.log('Copy code'),
      onClick: () => console.log('Copy code'),
    }
  ],
};