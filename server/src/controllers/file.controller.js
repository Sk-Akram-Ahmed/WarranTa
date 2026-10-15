exports.getFile = async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'File access has moved to /api/warranties/:id/files/:fileId/view.',
  });
};
