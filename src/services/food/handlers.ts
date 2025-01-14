import { responseMessages, type ReqHandler } from "@/lib/utils";
import { foodSchemas } from "./schemas";
import { PrismaClientKnownRequestError, prisma } from "@/lib/prisma";

const postFood: ReqHandler = async (req, res, next) => {
  try {
    const inputBody = foodSchemas.postBody.safeParse(req.body);
    if (!inputBody.success) {
      return res.status(400).json({
        message: responseMessages.error.reqBody,
      });
    }
    const insertResult = await prisma.food.create({
      data: inputBody.data,
    });
    const safeInsertResult = foodSchemas.base.parse(insertResult);
    return res.status(201).json({
      message: responseMessages.success.post,
      id: safeInsertResult.id,
    });
  } catch (error) {
    next(error);
  }
};
const getFoods: ReqHandler = async (req, res, next) => {
  try {
    const reqQueries = foodSchemas.queries.safeParse(req.query);
    if (!reqQueries.success) {
      return res.status(400).json({
        message: responseMessages.error.reqQueries,
      });
    }

    const foods = await prisma.food.findMany({
      select: { id: true, name: true, calorieAmount: true },
      skip: reqQueries.data.page * reqQueries.data.limit,
      take: reqQueries.data.limit,
    });
    const foodsCount = await prisma.food.count();
    const maxPage = Math.ceil(foodsCount / reqQueries.data.limit) - 1;

    return res.status(200).json({
      message: responseMessages.success.getAll,
      foods,
      pagination: {
        ...reqQueries.data,
        maxPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getFood: ReqHandler = async (req, res, next) => {
  try {
    const paramId = foodSchemas.params.safeParse(req.params);
    if (!paramId.success) {
      return res.status(400).json({
        message: responseMessages.error.reqParams,
      });
    }

    const food = await prisma.food.findFirst({
      where: { id: paramId.data.id },
      select: { name: true, calorieAmount: true },
    });

    if (!food) {
      return res.status(404).json({
        message: responseMessages.error.notFound,
      });
    }

    return res.status(200).json({
      message: responseMessages.success.get,
      name: food.name,
      calorieAmount: food.calorieAmount,
    });
  } catch (error) {
    next(error);
  }
};

const putFood: ReqHandler = async (req, res, next) => {
  try {
    const paramId = foodSchemas.params.safeParse(req.params);
    if (!paramId.success) {
      return res.status(400).json({
        message: responseMessages.error.reqParams,
      });
    }
    const inputBody = foodSchemas.postBody.safeParse(req.body);
    if (!inputBody.success) {
      return res.status(400).json({
        message: responseMessages.error.reqBody,
      });
    }
    await prisma.food.update({
      where: { id: paramId.data.id },
      data: inputBody.data,
    });

    return res.status(200).json({
      message: responseMessages.success.put,
    });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        message: responseMessages.error.notFound,
      });
    }
    next(error);
  }
};

const deleteFood: ReqHandler = async (req, res, next) => {
  try {
    const paramId = foodSchemas.params.safeParse(req.params);
    if (!paramId.success) {
      return res.status(400).json({
        message: responseMessages.error.reqParams,
      });
    }

    await prisma.food.delete({
      where: { id: paramId.data.id },
    });

    return res.status(200).json({
      message: responseMessages.success.delete,
    });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res.status(404).json({
        message: responseMessages.error.notFound,
      });
    }
    next(error);
  }
};

export const foodHandlers = {
  deleteFood,
  putFood,
  postFood,
  getFood,
  getFoods,
};
