const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-errors");

module.exports = {
  Query: {
    me: async (_, args, context) => {
      if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      const foundUser = await User.findOne({ _id: context.user._id });

      if (!foundUser) {
        throw new UserInputError("Cannot find a user with this id!");
      }

      return foundUser;
    },
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new UserInputError("Can't find this user");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Wrong password!");
      }

      const token = signToken(user);
      return { token, user };
    },

    addUser: async (_, { username, email, password }) => {
      const user = await User.create({ username, email, password });

      if (!user) {
        throw new UserInputError("Something is wrong!");
      }

      const token = signToken(user);
      return { token, user };
    },

    saveBook: async (_, { book }, context) => {
      if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $addToSet: { savedBooks: book } },
          { new: true, runValidators: true }
        );
        console.log("HEREEEEE", updatedUser);
        return updatedUser;
      } catch (err) {
        console.log(err);
        throw new UserInputError("Error saving book to user");
      }
    },

    removeBook: async (_, { bookId }, context) => {
      if (!context.user) {
        throw new AuthenticationError("You need to be logged in!");
      }

      const updatedUser = await User.findOneAndUpdate(
        { _id: context.user._id },
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      if (!updatedUser) {
        throw new UserInputError("Couldn't find user with this id!");
      }

      return updatedUser;
    },
  },
};
