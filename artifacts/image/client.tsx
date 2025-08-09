export const imageArtifact = {
  type: 'image',
  kind: 'image',
  name: 'Image',
  component: () => <div>Image artifact placeholder</div>,
  actions: [
    {
      description: 'Download image',
      icon: 'download',
      label: 'Download',
      handler: () => console.log('Download image'),
      onClick: () => console.log('Download image'),
    }
  ],
};