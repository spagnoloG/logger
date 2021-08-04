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

import SignInService from '../../api/SignInService';

export const Login = () => {

  SignInService.login({email: "test@user.com", password: "password"})

  return (
    <div>
      <Container maxW="xl" centerContent>
        <Heading>Login</Heading>
        <Box padding="4" maxW="4xl">
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
              <Input errorBorderColor="red.300" placeholder="Email" />
            </InputGroup>
            </GridItem>
            <GridItem rowSpan={1} colStart={2} colEnd={6}>
            <InputGroup>
              <InputLeftElement children={<RiKeyFill />} pointerEvents="none" />
              <Input
                type="password"
                placeholder="Enter password"
                errorBorderColor="red.300"
              />
            </InputGroup>
            </GridItem>
            <GridItem rowSpan={1} colStart={5} colEnd={6}>
            <Button>Enter</Button>
            </GridItem>
          </Grid>
          <br />
        </Box>
      </Container>
    </div>
  );
};
