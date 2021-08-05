import {
  Box,
  Container,
  Input,
  InputGroup,
  InputLeftElement,
  Heading,
  Button,
  Grid,
  GridItem,
} from '@chakra-ui/react';

import { SiMinutemailer } from 'react-icons/si';
import { RiKeyFill } from 'react-icons/ri';
import React, { useState, useEffect } from 'react';

import SignInService from '../../api/SignInService';

import SimpleAlert from '../alert/SimpleAlert';

export const Login = () => {
  const intialValues = { email: '', password: '' };

  const [formValues, setFormValues] = useState(intialValues);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverResponseErrors, setServerResponseErrors] = useState({});

  //input change handler
  const handleChange = e => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  //form submission handler
  const handleSubmit = e => {
    e.preventDefault();
    setFormErrors(validate(formValues));
    setIsSubmitting(true);
  };

  //form validation handler
  const validate = values => {
    let errors = {};
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!values.email) {
      errors.email = 'Cannot be blank';
    } else if (!regex.test(values.email)) {
      errors.email = 'Invalid email format.';
    }

    if (!values.password) {
      errors.password = 'Cannot be blank';
    } else if (values.password.length < 4) {
      errors.password = 'Password must be more than 4 characters';
    }

    return errors;
  };

  useEffect(() => {
    const submit = async () => {
      await SignInService.login(formValues)
        .then(response => {
          if (response.data.code === 'ERR_EMAIL_NOT_FOUND') {
            const error = {
              messageTitle: 'Email is not found!',
              message: 'Please check your email!',
              status: 'warning',
            };
            return setServerResponseErrors(error);
          } else if (response.data.code === 'ERR_INVALID_PASSWORD') {
            const error = {
              messageTitle: 'Password is invalid!',
              message: 'Please check your password',
              status: 'warning',
            };
            return setServerResponseErrors(error);
          } else if (response.data.code === 'ERR_UNKNOWN') {
            const error = {
              messageTitle: 'Unknown Error!',
              message: 'Server responded with an unknown error!',
              status: 'warning',
            };
            return setServerResponseErrors(error);
          }
        // User login is successful! Store JWT
        setServerResponseErrors({});
        console.log(response.data.token);
        })
        .catch(err => {
          const error = {
            messageTitle: 'Server fault!',
            message: 'Error while submiting form data',
            status: 'error',
          };
          return setServerResponseErrors(error);
        });
    };

    if (Object.keys(formErrors).length === 0 && isSubmitting) {
      submit();
    }
  }, [formErrors]);

  return (
    <div>
      <Container maxW="xl" centerContent>
        <Heading>Login</Heading>
        <Box padding="4" maxW="4xl">
          <form onSubmit={handleSubmit} noValidate>
            <Grid
              h="160px"
              templateRows="repeat(2, 1fr)"
              templateColumns="repeat(6, 1fr)"
              gap={2}
            >
              <GridItem rowSpan={1} colStart={2} colEnd={6}>
                <InputGroup>
                  <InputLeftElement
                    children={<SiMinutemailer />}
                    pointerEvents="none"
                  />
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    value={formValues.email}
                    onChange={handleChange}
                    isInvalid={formErrors.email}
                  ></Input>
                </InputGroup>
              </GridItem>

              {formErrors.email && (
                <GridItem rowSpan={1} colStart={2} colEnd={6}>
                  {formErrors.email}
                </GridItem>
              )}

              <GridItem rowSpan={1} colStart={2} colEnd={6}>
                <InputGroup>
                  <InputLeftElement
                    children={<RiKeyFill />}
                    pointerEvents="none"
                  />
                  <Input
                    type="password"
                    name="password"
                    id="password"
                    value={formValues.password}
                    onChange={handleChange}
                    className={formErrors.password && 'input-error'}
                  ></Input>
                </InputGroup>
              </GridItem>

              {formErrors.password && (
                <GridItem rowSpan={1} colStart={2} colEnd={6}>
                  {formErrors.password}
                </GridItem>
              )}

              <GridItem rowSpan={1} colStart={5} colEnd={6}>
                <Button type="submit">Enter</Button>
              </GridItem>

              {serverResponseErrors?.messageTitle && (
                <GridItem rowSpan={1} colStart={2} colEnd={6}>
                  <SimpleAlert
                    messageTitle={serverResponseErrors.messageTitle}
                    message={serverResponseErrors.message}
                    status={serverResponseErrors.status}
                  ></SimpleAlert>
                </GridItem>
              )}
            </Grid>
          </form>
        </Box>
      </Container>
    </div>
  );
};
