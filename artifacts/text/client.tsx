export const textArtifact = {
  type: 'text',
  kind: 'text',
  name: 'Text',
  component: () => <div>Text artifact placeholder</div>,
  actions: [
    {
      description: 'Copy text',
      icon: 'copy',
      label: 'Copy',
      handler: () => console.log('Copy text'),
      onClick: () => console.log('Copy text'),
    }
  ],
  onStreamPart: ({ streamPart, setArtifact, setMetadata }: any) => {
    // Handle text stream parts
    if (streamPart.type === 'data-content') {
      setArtifact((draft: any) => ({
        ...draft,
        content: (draft.content || '') + streamPart.data,
      }));
    }
  },
  toolbar: [],
};