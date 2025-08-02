import React from "react";
import { useEffect } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { alpha } from "@mui/material/styles";
import Chat from "./Chat";

import { APP_NAME } from "../env";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";

function LayoutApp() {
  const [userName, setUserName] = React.useState("Guest User");
  const [open, setOpen] = React.useState(false);

  const effectRan = React.useRef(false);
  useEffect(() => {
    if (!effectRan.current) {
      console.log("effect applied - only on the FIRST mount");
    }
    return () => (effectRan.current = true);
  }, []);

  const defaultTheme = createTheme({
    palette: {
      primary: {
        main: "#E30613", // Claro Red
        dark: "#B8050F", // Darker red
        light: "#FF4757", // Lighter red
      },
      secondary: {
        main: "#000000", // Black
        dark: "#1A1A1A", // Dark gray
        light: "#333333", // Light gray
      },
      background: {
        default: "#FFFFFF",
        paper: "#FAFAFA",
      },
      text: {
        primary: "#000000",
        secondary: "#333333",
      },
    },
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyles
        styles={{ ul: { margin: 0, padding: 0, listStyle: "none" } }}
      />
      <CssBaseline />
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8F8F8 100%)",
          borderBottom: "2px solid #E30613",
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "1px",
            backgroundImage: (theme) => `linear-gradient(to right, 
                                  ${theme.palette.divider}, 
                                  ${alpha("#E30613", 0.5)}, 
                                  ${theme.palette.divider})`,
          },
        }}
      >
        <Toolbar sx={{ flexWrap: "wrap", p: 1, m: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ 
                height: "50px", 
                width: "auto",
                marginRight: "12px"
              }} 
            />
          </Box>
          <Typography
            variant="h6"
            noWrap
            sx={{ 
              flexGrow: 1, 
              p: 0, 
              m: 0,
              color: "#000000",
              fontWeight: 600,
            }}
          >
            {APP_NAME}
          </Typography>
          <Box sx={{ display: { xs: "none", sm: "inline" } }}>
            <Chip
              sx={{
                border: "1px solid #E30613",
                fontSize: "0.95em",
                color: "#000000", // Black text
                backgroundColor: "#FFFFFF",
                "& .MuiChip-icon": {
                  color: "#E30613", // Red icon
                },
                "&:hover": {
                  backgroundColor: "#FFF5F5",
                  borderColor: "#B8050F",
                },
              }}
              label={userName}
              variant="outlined"
              icon={<SentimentSatisfiedAltIcon />}
            />
          </Box>
        </Toolbar>
      </AppBar>
      <Container disableGutters maxWidth="xl" component="main">
        <Chat userName={userName} />
      </Container>
      <Box textAlign={"center"}>
        <Typography
          variant="body2"
          sx={{ pb: 1, pl: 2, pr: 2, fontSize: "0.775rem" }}
        >
          &copy;{new Date().getFullYear()}, Amazon Web Services, Inc. or its
          affiliates. All rights reserved.
        </Typography>
        <img src="/images/Powered-By_logo-horiz_RGB.png" />
      </Box>

      <Box sx={{ position: "fixed", bottom: "8px", right: "12px" }}>
        <IconButton aria-label="" onClick={handleClickOpen}>
          <CloudOutlinedIcon />
        </IconButton>
      </Box>

      <Dialog maxWidth={"xl"} open={open} onClose={handleClose}>
        <DialogTitle>Data Analyst Assistant Architecture Diagram</DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center">
            <img
              src="/images/gen-ai-assistant-diagram.png"
              style={{
                maxWidth: "100%",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
              alt="Powered By AWS"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default LayoutApp;
