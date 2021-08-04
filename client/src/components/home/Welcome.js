import { Container, Box, Heading, Grid, GridItem } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
export const Welcome = () => {
  return (
    <Container maxW="xl" centerContent>
      <Box padding="4" maxW="3xl">
        <Grid
          h="600px"
          templateRows="repeat(3, 1fr)"
          templateColumns="repeat(3, 1fr)"
          gap={2}
        >
        <GridItem rowSpan={1} colStart={1} colEnd={3}>
            <Heading>Welcome</Heading>
        </GridItem>
        <GridItem colStart={0} colEnd={1}>
        <Link to="/login">login </Link>
        </GridItem>
        <GridItem colStart={3} colEnd={3}>
        <Link to="/register">register </Link>
        </GridItem>
        </Grid>
      </Box>
    </Container>
  );
};
