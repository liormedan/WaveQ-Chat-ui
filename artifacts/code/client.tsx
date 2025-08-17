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
  onStreamPart: ({ streamPart, setArtifact, setMetadata }: any) => {
    // Handle code stream parts
    if (streamPart.type === 'data-content') {
      setArtifact((draft: any) => ({
        ...draft,
        content: (draft.content || '') + streamPart.data,
      }));
    }
  },
  toolbar: [],
};