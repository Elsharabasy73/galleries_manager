class ApiFeatures {
  constructor(dbModel, queryParamsString, modelName = "", includeOptions = {}) {
    this.dbModel = dbModel;
    this.queryParamsString = queryParamsString;
    this.modelName = modelName;

    this.query = {
      where: {},
      include: includeOptions,
    };
  }

  filter() {
    const queryParamsStringObj = { ...this.queryParamsString };

    const excludesFields = ["page", "sort", "limit", "fields", "keyword"];

    excludesFields.forEach((field) => delete queryParamsStringObj[field]);

    const where = {};

    //Object.entries(queryParamsStringObj): [ [ 'phone', '010260417501' ] ]
    for (const [key, value] of Object.entries(queryParamsStringObj)) {
      if (typeof value === "object" && value !== null) {
        const operators = {};
        // Handle operators:
        // price[gte]=100
        // price[lte]=500

        for (const [operator, operatorValue] of Object.entries(value)) {
          switch (operator) {
            case "gte":
              operators.gte = operatorValue;
              break;

            case "gt":
              operators.gt = operatorValue;
              break;

            case "lte":
              operators.lte = operatorValue;
              break;

            case "lt":
              operators.lt = operatorValue;
              break;
          }
        }

        where[key] = operators;
      } else {
        // Handle operators:
        // price=100
        where[key] = value;
      }
    }
    this.query.where = {
      ...this.query.where,
      ...where,
    };

    return this;
  }

  limitFields() {
    if (this.queryParamsString.fields) {
      const fields = this.queryParamsString.fields.split(",");

      this.query.select = {};

      fields.forEach((field) => {
        this.query.select[field] = true;
      });
    }

    return this;
  }

  search(keyword = "") {
    if (keyword) {
      switch (this.modelName) {
        case "user":
        case "employee":
          this.query.where = {
            ...this.query.where,
            OR: [
              { firstName: { contains: keyword } },
              { lastName: { contains: keyword } },
            ],
          };
          break;
        default:
          this.query.where = {
            ...this.query.where,
            name: { contains: keyword },
          };
          break;
      }
    }

    return this;
  }

  paginate() {
    const page = parseInt(this.queryParamsString.page, 10) || 1;
    const limit = parseInt(this.queryParamsString.limit, 10) || 10;
    this.query.take = limit;
    this.query.skip = (page - 1) * limit;

    return this;
  }

  sort() {
    if (this.queryParamsString.sort) {
      const sortFields = this.queryParamsString.sort.split(",");

      this.query.orderBy = sortFields.map((field) => {
        if (field.startsWith("-")) {
          return {
            [field.substring(1)]: "desc",
          };
        }

        return {
          [field]: "asc",
        };
      });
    } else {
      this.query.orderBy = {
        createdAt: "desc",
      };
    }

    return this;
  }

  execute() {
    return this.dbModel.findMany(this.query);
  }
}

module.exports = ApiFeatures;
