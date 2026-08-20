const asyncHandler = require("express-async-handler");
const ApiError = require("../shared/utils/ApiError");
const ApiFeatures = require("../shared/utils/apiFeatures");

exports.createOne = (model) =>
  asyncHandler(async (req, res) => {
    console.log("model:", model);
    const document = await model.create({
      data: req.body,
    });

    res.status(201).json({
      data: document,
    });
  });

exports.deleteOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
      const document = await model.delete({
        where: {
          id,
        },
      });

      res.status(204).send(document);
    } catch (error) {
      if (error.code === "P2025") {
        return next(new ApiError(`No document for this id ${id}`, 404));
      }

      next(error);
    }
  });

exports.updateOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    try {
      const document = await model.update({
        where: {
          id,
        },
        data: req.body,
      });

      res.status(200).json({
        data: document,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return next(new ApiError(`No document for this id ${id}`, 404));
      }

      next(error);
    }
  });

exports.getOne = (model) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const document = await model.findUnique({
      where: {
        id,
      },
    });

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(200).json({
      data: document,
    });
  });

exports.getAll = (Model, modelName = "") => {
  return asyncHandler(async (req, res) => {
    const apiFeatures = new ApiFeatures(Model, req.query, modelName);
    apiFeatures
      .search(req.query.keyword)
      .paginate()
      .limitFields()
      .filter()
      .sort();

    const documents = await apiFeatures.execute();
    // console.log("documents:", documents);
    res.status(200).json({
      results: documents.length,
      data: documents.map((document) => document),
    });
  });
};
