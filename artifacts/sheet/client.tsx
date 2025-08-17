export const sheetArtifact = {
  type: 'sheet',
  kind: 'sheet',
  name: 'Sheet',
  component: () => <div>Sheet artifact placeholder</div>,
  actions: [
    {
      description: 'Export sheet',
      icon: 'download',
      label: 'Export',
      handler: () => console.log('Export sheet'),
      onClick: () => console.log('Export sheet'),
    }
  ],
  onStreamPart: ({ streamPart, setArtifact, setMetadata }: any) => {
    // Handle sheet stream parts
    if (streamPart.type === 'data-content') {
      setArtifact((draft: any) => ({
        ...draft,
        content: (draft.content || '') + streamPart.data,
      }));
    }
  },
  toolbar: [],
};